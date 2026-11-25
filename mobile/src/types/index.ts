export interface User {
  id: string;
  name: string;
  email: string;
  rating: number;
  points: number;
  solvedCount: number;
  streak: number;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  acceptance: string;
  solved?: boolean;
  description: string;
  starterCode: {
    python: string;
    javascript: string;
    cpp: string;
    java: string;
  };
}

export interface InterviewMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}
