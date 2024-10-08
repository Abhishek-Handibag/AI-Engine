# AI Engine

## Overview
AI Engine is a comprehensive platform for developing and managing AI-powered applications, designed to streamline the entire process from model building to data deployment. It is currently under active development, with new features being added regularly.

## Current Features
As of now, the platform has introduced a **Data Enrichment** capability. This feature allows Large Language Models (LLMs) to provide answers based on the latest available data, even if the LLM does not have access to this information.

- **LLM + Real-Time Data Integration**: We have integrated a real-time data fetching mechanism using the Google Custom Search API to retrieve the latest data from the web. This data is fed into the LLM, enabling it to answer questions with up-to-date information.
- **Gemini 1.5 LLM**: The backend utilizes the Gemini 1.5 model through a Flask application, which is enhanced with data retrieved from the Google Search API. This approach helps the LLM compensate for its lack of recent data knowledge.

## Tech Stack
- **Frontend**: React
- **Backend**: Flask
- **LLM**: Gemini 1.5
- **External API**: Google Custom Search API

## Project Stage
This is the **first stage** of the project, focusing on real-time data enrichment for AI models. The platform will continue to evolve with new features and AI-related functionalities. 

## Future Plans
We are actively working on adding new AI-driven features and improvements to the platform. Expect regular updates, including:
- New AI project ideas and implementations
- Enhanced data processing and model management capabilities
- More integrations with various data sources

## Contributing
We welcome contributions and ideas for improving the platform. Please feel free to open issues or submit pull requests.
