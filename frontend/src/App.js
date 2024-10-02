import React, { useState, useEffect, useRef } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Box,
  List,
  ListItem,
  Divider,
  Drawer,
  IconButton,
  Card,
  CardContent,
  Fade,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import CreateIcon from "@mui/icons-material/Create";
import SchoolIcon from "@mui/icons-material/School";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1a8870",
    },
    background: {
      default: "#343541",
      paper: "#444654",
    },
    text: {
      primary: "#ffffff",
      secondary: "#a0a0a0",
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
});

const TaskCards = ({ onCardClick }) => {
  const taskCards = [
    { icon: ImageIcon, text: "Create an illustration for a bakery" },
    { icon: DescriptionIcon, text: "Summarize a long document" },
    { icon: CreateIcon, text: "Thank my interviewer" },
    { icon: SchoolIcon, text: "Explain nostalgia to a kindergartener" },
  ];

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
      }}
    >
      <Box sx={{ mb: 4 }}>
        <svg className="w-12 h-12 text-white" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12,8L10.67,8.09C9.81,7.07 7.4,4.5 5,4.5C5,4.5 3.03,7.46 4.96,11.41C4.41,12.24 4.07,12.67 4,13.66L2.07,13.95L2.28,14.93L4.04,14.67L4.18,15.38L2.61,16.32L3.08,17.21L4.53,16.32C5.68,18.76 8.59,20 12,20C15.41,20 18.32,18.76 19.47,16.32L20.92,17.21L21.39,16.32L19.82,15.38L19.96,14.67L21.72,14.93L21.93,13.95L20,13.66C19.93,12.67 19.59,12.24 19.04,11.41C20.97,7.46 19,4.5 19,4.5C16.6,4.5 14.19,7.07 13.33,8.09L12,8M9,11A1,1 0 0,1 10,12A1,1 0 0,1 9,13A1,1 0 0,1 8,12A1,1 0 0,1 9,11M15,11A1,1 0 0,1 16,12A1,1 0 0,1 15,13A1,1 0 0,1 14,12A1,1 0 0,1 15,11M11,14H13L12.3,15.39C12.5,16.03 13.06,16.5 13.75,16.5A1.5,1.5 0 0,0 15.25,15H15.75A2,2 0 0,1 13.75,17C13,17 12.35,16.59 12,16V16H12C11.65,16.59 11,17 10.25,17A2,2 0 0,1 8.25,15H8.75A1.5,1.5 0 0,0 10.25,16.5C10.94,16.5 11.5,16.03 11.7,15.39L11,14Z"
          />
        </svg>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            lg: "1fr 1fr 1fr 1fr",
          },
          gap: 2,
        }}
      >
        {taskCards.map((card, index) => (
          <Card
            key={index}
            sx={{
              bgcolor: "background.paper",
              color: "text.primary",
              width: 250,
              height: 120,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 3,
              },
            }}
            onClick={() => onCardClick(card.text)}
          >
            <CardContent
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <card.icon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body2" align="center">
                {card.text}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

const AnalysisResults = ({ summary, centralPages }) => {
  const formatContent = (content) => {
    const sections = content.split("##").filter(Boolean);

    return sections.map((section, index) => {
      const [title, ...body] = section.split("\n").filter(Boolean);
      return (
        <Box key={index} sx={{ mb: 3 }}>
          {index === 0 ? (
            <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
              {title.trim()}
            </Typography>
          ) : (
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              {title.trim()}
            </Typography>
          )}
          {body.map((paragraph, pIndex) => {
            if (paragraph.startsWith("```")) {
              const [, language, ...code] = paragraph.split("\n");
              const codeContent = code.join("\n").replace("```", "").trim();
              return (
                <Box key={pIndex} sx={{ my: 2 }}>
                  <SyntaxHighlighter language={language} style={atomDark}>
                    {codeContent}
                  </SyntaxHighlighter>
                </Box>
              );
            } else {
              return (
                <Typography key={pIndex} paragraph>
                  {paragraph.replace(/\*\*/g, "").replace(/\*/g, "")}
                </Typography>
              );
            }
          })}
        </Box>
      );
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      {formatContent(summary)}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Most Central Pages:
      </Typography>
      <List>
        {centralPages.map((page, index) => (
          <ListItem key={index}>
            <Typography
              component="a"
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: "#1a8870" }}
            >
              {page.title}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

const Message = ({ content, isUser }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      mb: 2,
      backgroundColor: isUser ? "background.default" : "background.paper",
      borderRadius: 2,
      width: "100%",
      color: "text.primary",
    }}
  >
    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
      {isUser ? "You:" : "LLM:"}
    </Typography>
    {isUser ? (
      <Typography>{content}</Typography>
    ) : (
      <AnalysisResults
        summary={content.summary}
        centralPages={content.central_pages}
      />
    )}
  </Paper>
);

const App = () => {
  const [question, setQuestion] = useState("");
  const [currentConversation, setCurrentConversation] = useState({
    messages: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleCardClick = (cardText) => {
    setQuestion(cardText);
    handleSubmit(null, cardText);
  };

  const handleSubmit = async (e, cardText = null) => {
    if (e) e.preventDefault();
    const submittedQuestion = cardText || question;
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/analyze", {
        question: submittedQuestion,
      });
      const newMessage = { content: submittedQuestion, isUser: true };
      const newResponse = { content: response.data, isUser: false };

      setCurrentConversation((prev) => ({
        messages: [...prev.messages, newMessage, newResponse],
      }));
      setQuestion("");
    } catch (err) {
      setError(
        "An error occurred while processing your request. Please try again."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
    setTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1000);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: 3,
            "&::-webkit-scrollbar": {
              width: "0.4em",
            },
            "&::-webkit-scrollbar-track": {
              background: "#444654",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#1a8870",
              borderRadius: "10px",
            },
          }}
        >
          {currentConversation.messages.length === 0 ? (
            <TaskCards onCardClick={handleCardClick} />
          ) : (
            <List>
              {currentConversation.messages.map((message, index) => (
                <ListItem key={index} disableGutters>
                  <Message content={message.content} isUser={message.isUser} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        <Box sx={{ p: 3, flexGrow: 0 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Enter your question"
              variant="outlined"
              value={question}
              onChange={handleQuestionChange}
              margin="normal"
              InputLabelProps={{
                style: { color: "#a0a0a0" },
              }}
              InputProps={{
                style: { color: "#ffffff" },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !question}
              sx={{ mt: 2 }}
            >
              Generate
            </Button>
          </form>
          {(loading || typing) && (
            <Fade in={loading || typing}>
              <CircularProgress sx={{ mt: 2 }} />
            </Fade>
          )}
          {error && (
            <Fade in={!!error}>
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "error.dark",
                  color: "error.contrastText",
                  borderRadius: 2,
                }}
              >
                <Typography>{error}</Typography>
              </Paper>
            </Fade>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;