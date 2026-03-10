import express from 'express';
import { generateBite, saveResult, getSummary, getRandomBites } from '../controllers/testController.js';
import { chatTutor } from '../controllers/chatController.js';
import { checkAndDeductCredits } from '../middleware/creditMiddleware.js';
import { rechargeCredits, syncUser, upgradePremium, rewardCredits } from '../controllers/creditController.js';
import { saveWord, getVocabList, deleteWord, getVocabQuiz } from '../controllers/vocabController.js';
import { defineWord } from '../controllers/aiController.js';

const router = express.Router();

// User & Credits
router.get('/user/sync', syncUser);
router.post('/credits/recharge', rechargeCredits);
router.post('/credits/upgrade-premium', upgradePremium);
router.post('/credits/reward', rewardCredits);

// Vocabulary
router.post('/vocab/save', saveWord);
router.get('/vocab/list', getVocabList);
router.delete('/vocab/word/:id', deleteWord);
router.get('/vocab/quiz', getVocabQuiz);

// AI Features
router.post('/generate-bite', checkAndDeductCredits(5), generateBite);
router.post('/chat-tutor', checkAndDeductCredits(1), chatTutor);
router.post('/ai/define-word', defineWord);
router.post('/save-result', saveResult);
router.post('/get-summary', getSummary);
router.get('/random-bites', getRandomBites);

export default router;

