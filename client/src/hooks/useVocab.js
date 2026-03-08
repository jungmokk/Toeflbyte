import axios from 'axios';
import useStore from '../store/useStore';

import { API_BASE_URL } from '../config/apiConfig';

const BASE_URL = API_BASE_URL;


const useVocab = () => {
  const { userId } = useStore();

  const saveWord = async (word, meaning, context) => {
    try {
      const response = await axios.post(`${BASE_URL}/vocab/save`, 
        { word, meaning, context },
        { headers: { 'x-user-id': userId } }
      );
      return response.data;
    } catch (error) {
      console.error('Save Word Error:', error);
      throw error;
    }
  };

  const getVocabList = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/vocab/list`, {
        headers: { 'x-user-id': userId }
      });
      return response.data.data;
    } catch (error) {
      console.error('Get Vocab List Error:', error);
      throw error;
    }
  };

  const deleteWord = async (id) => {
    try {
      const response = await axios.delete(`${BASE_URL}/vocab/word/${id}`, {
        headers: { 'x-user-id': userId }
      });
      return response.data;
    } catch (error) {
      console.error('Delete Word Error:', error);
      throw error;
    }
  };

  return { saveWord, getVocabList, deleteWord };
};

export default useVocab;
