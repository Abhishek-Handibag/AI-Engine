import asyncio
from bs4 import BeautifulSoup
import aiohttp
import google.generativeai as genai
from aiocache import cached
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import networkx as nx
import nltk
from nltk.tokenize import sent_tokenize
import logging
import re
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
import os
from urllib.parse import urljoin, urlparse

load_dotenv()

app = Flask(__name__)
CORS(app)

# Download necessary NLTK data
nltk.download('punkt', quiet=True)

# Load environment variables
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
SEARCH_ENGINE_ID = os.getenv('SEARCH_ENGINE_ID')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@cached(ttl=3600)
async def web_search(query):
    url = f"https://www.googleapis.com/customsearch/v1?q={query}&key={GOOGLE_API_KEY}&cx={SEARCH_ENGINE_ID}"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            search_results = await response.json()
    
    links = []
    if "items" in search_results:
        results = search_results["items"]
        links = [result['link'] for result in results[:5]]  # top 5 results
    else:
        logger.warning("No results found")
    
    return links

async def scrape_data(url, visited=None):
    if visited is None:
        visited = set()
    
    if url in visited:
        return None
    
    visited.add(url)
    logger.info(f"Scraping data from: {url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    content = await response.text()
                    soup = BeautifulSoup(content, 'html.parser')
                    
                    url_data = {'url': url}
                    url_data['title'] = soup.title.string if soup.title else "No title found"
                    url_data['content'] = extract_main_content(soup)
                    url_data['metadata'] = extract_metadata(soup)
                    
                    logger.info(f"Successfully scraped data from {url}")
                    return url_data
                else:
                    logger.warning(f"Failed to retrieve the page. Status code: {response.status}")
                    return None
        
    except Exception as e:
        logger.error(f"An error occurred while scraping {url}: {e}")
        return None

def extract_main_content(soup):
    main_content = ''
    for tag in soup.find_all(['p', 'h1', 'h2', 'h3', 'li']):
        main_content += tag.get_text() + '\n'
    return main_content

def clean_and_filter_links(base_url, links):
    cleaned_links = []
    for link in links:
        href = link.get('href')
        if href and not href.startswith(('#', 'javascript:')):
            full_url = urljoin(base_url, href)
            if not re.search(r'/(login|signup|register|forgot|password)', full_url, re.IGNORECASE):
                if '?' not in full_url:
                    if urlparse(full_url).netloc == urlparse(base_url).netloc:
                        cleaned_links.append(full_url)
    return list(set(cleaned_links))

def extract_metadata(soup):
    metadata = {}
    meta_tags = soup.find_all('meta')
    for tag in meta_tags:
        if 'name' in tag.attrs and 'content' in tag.attrs:
            metadata[tag['name']] = tag['content']
    return metadata

@cached(ttl=3600)
async def process_with_llm(scraped_data, question):
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-pro")

    all_content = prepare_content_for_analysis(scraped_data)
    relevant_content = find_relevant_content(all_content, question)
    
    prompt = f"""Analyze the following data from multiple web pages in relation to this question: "{question}"

    {relevant_content}
    Please provide a comprehensive, descriptive, and engaging response that directly addresses the question. Organize your answer with clear headings, subheadings, and bullet points to enhance readability. Break down complex ideas into simple terms, and include examples where relevant to clarify key points. Use bold or italics to emphasize important details. Ensure your response is thorough, informative, easy to understand, and directly related to the question, offering a complete yet concise summary.
    Also don't mention data is given to you from which you are creating response,(don't mention things like "The provided data clearly indicates")"""

    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        logger.info("LLM Analysis and Summary completed")
        return response.text
    except Exception as e:
        logger.error(f"An error occurred while processing with the LLM: {e}")
        return None

def prepare_content_for_analysis(scraped_data):
    all_content = ""
    for data in scraped_data:
        all_content += f"\nTitle: {data['title']}\nURL: {data['url']}\nContent:\n{data['content']}\n\n"
        if 'metadata' in data:
            all_content += f"Metadata:\n{data['metadata']}\n\n"
    return all_content

def find_relevant_content(all_content, question):
    chunks = split_into_chunks(all_content)
    vectorizer = TfidfVectorizer()
    chunk_embeddings = vectorizer.fit_transform(chunks)
    question_embedding = vectorizer.transform([question])
    similarities = cosine_similarity(question_embedding, chunk_embeddings)[0]
    top_indices = similarities.argsort()[-5:][::-1]
    relevant_content = "\n\n".join([chunks[i] for i in top_indices])
    return relevant_content

def split_into_chunks(text, chunk_size=1000):
    try:
        sentences = sent_tokenize(text)
    except LookupError:
        logger.warning("NLTK punkt tokenizer not found. Falling back to simple sentence splitting.")
        sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) > chunk_size:
            chunks.append(current_chunk)
            current_chunk = sentence
        else:
            current_chunk += " " + sentence
    if current_chunk:
        chunks.append(current_chunk)
    return chunks

def build_graph(scraped_data):
    G = nx.DiGraph()
    for data in scraped_data:
        G.add_node(data['url'], title=data['title'])
    return G

def analyze_graph(G):
    pagerank = nx.pagerank(G)
    central_pages = sorted(pagerank, key=pagerank.get, reverse=True)[:5]
    return central_pages

@app.route('/analyze', methods=['POST'])
async def analyze():
    data = request.json
    question = data.get('question')
    
    if not question:
        return jsonify({"error": "No question provided"}), 400

    initial_links = await web_search(question)
    logger.info(f"Initial links to be processed: {initial_links}")

    all_scraped_data = []
    visited_links = set()

    async def process_link(link):
        scraped_data = await scrape_data(link, visited_links)
        if scraped_data:
            all_scraped_data.append(scraped_data)

    await asyncio.gather(*[process_link(link) for link in initial_links])

    if all_scraped_data:
        graph = build_graph(all_scraped_data)
        central_pages = analyze_graph(graph)
        logger.info(f"Most central pages: {central_pages}")
        
        central_pages_info = [
            {"title": graph.nodes[page]['title'], "url": page} for page in central_pages
        ]
        
        summary = await process_with_llm(all_scraped_data, question)
        return jsonify({"summary": summary, "central_pages": central_pages_info})
    else:
        logger.warning("No data was scraped. Please check the URLs and your internet connection.")
        return jsonify({"error": "No data could be scraped"}), 500

if __name__ == '__main__':
    app.run(debug=True)