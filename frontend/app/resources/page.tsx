'use client';

import { useState, useEffect } from 'react';
import { FaPlay, FaBookOpen, FaChevronDown } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { Bars3Icon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './resources.css';

// Use isomorphic layout effect to prevent SSR warnings
import { useEffect as useLayoutEffect } from 'react';
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ResourcesPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string>('');
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([ 'Math: Addition', 'Science: Plants', 'English: Verbs' ]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const login = async () => {
      try {
        const formData = new URLSearchParams();
        formData.append('username', 'demo_user');
        formData.append('password', 'demo_password');

        const response = await fetch('http://localhost:8000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });

        if (!response.ok) throw new Error('Login failed');

        const data = await response.json();
        setAuthToken(data.access_token);
      } catch (error) {
        console.error('Login error:', error);
      }
    };
    login();
  }, []);

  useIsomorphicLayoutEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/subjects/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useIsomorphicLayoutEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedCategory) {
        setSubcategories([]);
        return;
      }
      try {
        const response = await fetch(`http://localhost:8000/api/subjects/subcategories/${encodeURIComponent(selectedCategory)}`);
        const data = await response.json();
        setSubcategories(data);
        setSelectedSubcategory('');
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      }
    };
    fetchSubcategories();
  }, [selectedCategory]);

  useIsomorphicLayoutEffect(() => {
    const fetchExplanation = async () => {
      if (!selectedSubcategory || !authToken) {
        setExplanation('');
        return;
      }
      setIsLoading(true);
      try {
        const cacheResponse = await fetch(`http://localhost:8000/api/cache/explanation/${encodeURIComponent(selectedSubcategory)}`);
        const cacheData = await cacheResponse.json();
        if (cacheData.explanation) {
          setExplanation(cacheData.explanation);
        } else {
          const formData = new FormData();
          formData.append('message', `I don't understand ${selectedSubcategory}. Can you explain it to me?`);

          const chatResponse = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData,
          });

          const chatData = await chatResponse.json();

          await fetch(`http://localhost:8000/api/cache/explanation/${encodeURIComponent(selectedSubcategory)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ explanation: chatData.response }),
          });

          setExplanation(chatData.response);
        }
      } catch (error) {
        console.error('Error fetching explanation:', error);
        setExplanation('Failed to load explanation. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExplanation();
  }, [selectedSubcategory, authToken]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`flex-1 flex flex-col p-6 gap-6 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : ''}`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-white" />
          </button>
          <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-600 transition-colors">
            <FaBookOpen className="w-5 h-5" /> <span>New Topic</span>
          </button>
        </div>

        <div className="flex gap-8">
          <div className="w-[300px] flex-shrink-0 space-y-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {selectedCategory && (
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full p-3 border rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a Subcategory</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                ))}
              </select>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-3">Recently Viewed</h3>
              <div className="space-y-1">
                {recentlyViewed.map((topic, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900 text-gray-600 dark:text-gray-200 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-6">
              {selectedCategory && (
                <span className="inline-block bg-purple-100 dark:bg-purple-700 text-purple-700 dark:text-white px-4 py-1 rounded-full text-sm font-medium mb-2">
                  {selectedCategory}
                </span>
              )}
              <h1 className="text-3xl font-bold">
                {selectedCategory && selectedSubcategory ? `${selectedCategory}: ${selectedSubcategory}` : 'Select a category and subcategory'}
              </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow">
              {selectedCategory && selectedSubcategory ? (
                <>
                  <h2 className="text-2xl font-bold mb-4">Let's Learn {selectedSubcategory}!</h2>
                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 text-gray-400 text-lg italic">
                  <p>Please select a category and subcategory to start learning.</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-[380px] flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
              <h2 className="text-xl font-bold mb-6">Helpful Resources</h2>
              <div className="space-y-6 h-[640px] overflow-y-auto pr-4 custom-scrollbar">
                {(videoLists[`${selectedCategory}: ${selectedSubcategory}`] || []).map((video, index) => (
                  <div key={index} className="group">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-xl aspect-video flex items-center justify-center mb-3">
                      <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center group-hover:bg-purple-700 transition-colors">
                        <FaPlay className="w-6 h-6 text-white ml-1" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-1 group-hover:text-purple-600 transition-colors">{video.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{video.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const videoLists: Record<string, { title: string; description: string }[]> = {
  'Math: Addition': [
    { title: 'Addition Basics', description: 'Learn the basics of addition.' },
    { title: 'Adding Large Numbers', description: 'How to add large numbers.' },
  ],
  'Science: Plants': [
    { title: 'Photosynthesis Explained', description: 'Understanding photosynthesis.' },
    { title: 'Plant Life Cycle', description: 'The life cycle of a plant.' },
  ],
  'English: Verbs': [
    { title: 'Understanding Verbs', description: 'What are verbs?' },
    { title: 'Action vs. State Verbs', description: 'Difference between action and state verbs.' },
  ],
};
const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <div
      className={`fixed inset-0 z-40 bg-gray-800 bg-opacity-75 transition-opacity ${isOpen ? 'block' : 'hidden'}`}
      onClick={onClose}
    >
      <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-lg p-6">
        <button onClick={onClose} className="text-gray-600 dark:text-white mb-4">
          Close
        </button>
        <SidebarContent />
      </div>
    </div>
  );
}
const SidebarContent = () => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sidebar Content</h2>
      <ul className="space-y-2">
        <li>
          <a href="#" className="text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-300">
            Link 1
          </a>
        </li>
        <li>
          <a href="#" className="text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-300">
            Link 2
          </a>
        </li>
        <li>
          <a href="#" className="text-gray-600 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-300">
            Link 3
          </a>
        </li>
      </ul>
    </div>
  );
}
const videoLists: Record<string, { title: string; description: string }[]> = {
  'Math: Addition': [
    { title: 'Addition Basics', description: 'Learn the basics of addition.' },
    { title: 'Adding Large Numbers', description: 'How to add large numbers.' },
  ],
  'Science: Plants': [
    { title: 'Photosynthesis Explained', description: 'Understanding photosynthesis.' },
    { title: 'Plant Life Cycle', description: 'The life cycle of a plant.' },
  ],
  'English: Verbs': [
    { title: 'Understanding Verbs', description: 'What are verbs?' },
    { title: 'Action vs. State Verbs', description: 'Difference between action and state verbs.' },
  ],
};
