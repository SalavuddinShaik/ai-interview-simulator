"use client"; 
import { useState, useEffect, useContext } from "react";
import { fetchAnswers, saveAnswer } from "../../services/api";
import AuthContext from "../../context/AuthContext";
import { motion } from "framer-motion";

export default function Dashboard() {
    const { token, logoutUser } = useContext(AuthContext);
    const [answers, setAnswers] = useState([]);
    const [question, setQuestion] = useState("");
    const [userAnswer, setUserAnswer] = useState("");

    useEffect(() => {
        if (token) {
            fetchAnswers(token).then(setAnswers);
        }
    }, [token]);

    const handleSaveAnswer = async () => {
        const response = await saveAnswer(token, question, userAnswer, "AI Feedback", 10);
        alert(response.message);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
            <motion.h2 
                className="text-3xl font-bold text-gray-800 mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Dashboard
            </motion.h2>

            <motion.button 
                onClick={logoutUser} 
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                Logout
            </motion.button>

            <div className="mt-6 bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
                <h3 className="text-xl font-semibold mb-4">Submit Your Answer</h3>
                <input 
                    type="text" 
                    placeholder="Enter Question" 
                    value={question} 
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full p-2 border rounded-md mb-3"
                />
                <input 
                    type="text" 
                    placeholder="Your Answer" 
                    value={userAnswer} 
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-full p-2 border rounded-md mb-3"
                />
                <motion.button 
                    onClick={handleSaveAnswer} 
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Save Answer
                </motion.button>
            </div>

            <div className="mt-6 bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
                <h3 className="text-xl font-semibold mb-4">Your Answers</h3>
                <ul>
                    {answers.map((a, index) => (
                        <motion.li 
                            key={index} 
                            className="p-2 border-b"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <strong>{a.question}:</strong> {a.userAnswer}
                        </motion.li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
