

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ResultsGrid } from './components/ResultsGrid';
import { Loader } from './components/Loader';
import { EmptyState } from './components/EmptyState';
import { History } from './components/History';
import { FilterControls } from './components/FilterControls';
import { getChatResponseFromAIStream, getTextSearchTermsFromAI, getVisualSearchResultsFromAI } from './services/aiService';
import { getTrending, getMediaDetails, getWatchProviders, getSimilarMedia, getRecommendedMedia, searchMedia } from './services/tmdbService';
import { TMDbResult, View, SortOption, FilterOption, DetailedTMDbResult, ChatMessage } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Welcome } from './components/Welcome';
import { TMDB_PAGE_SIZE, SUPPORTED_LANGUAGES } from './constants';
import { DetailView } from './components/DetailView';
import { ChatView } from './components/ChatView';
import { InstructionsModal } from './components/InstructionsModal';


const ChatIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" aria-hidden="true">
        <path fillRule="evenodd" d="M5.337 21.063a.75.75 0 0 1-.613.882c-1.34.22-2.58.6-3.737 1.125a.75.75 0 0 1-1.002-.873 11.233 11.233 0 0 1 2.25-5.223.75.75 0 0 1 .43-.33L3 16.5c-1.468-1.468-2.25-3.41-2.25-5.437 0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5c0 4.142-4.03 7.5-9 7.5a10.02 10.02 0 0 1-5.337-1.563Z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M15.75 8.25a.75.75 0 0 1 .75.75v5.13l1.19-1.19a.75.75 0 0 1 1.06 1.06l-2.5 2.5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.19 1.19V9a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
);

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove the initial 'data:image/jpeg;base64,' part
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPaginating, setIsPaginating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TMDbResult[]>([]);
  const [view, setView] = useState<View>('trending');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<SortOption>('popularity');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [loaderMessage, setLoaderMessage] = useState<string>('AI is analyzing your request...');
  
  const [favorites, setFavorites] = useLocalStorage<string[]>('cinesuggest_favorites', []);
  const [history, setHistory] = useLocalStorage<string[]>('cinesuggest_history', []);
  const [hasSeenInstructions, setHasSeenInstructions] = useLocalStorage<boolean>('cinesuggest_instructions_seen', false);
  
  // Localization State
  const [language, setLanguage] = useLocalStorage<string>('cinesuggest_language', 'en-US');
  const [region, setRegion] = useLocalStorage<string>('cinesuggest_region', 'US');


  // Detail View State
  const [selectedItem, setSelectedItem] = useState<TMDbResult | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedTMDbResult | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { role: 'ai', content: "Hi! I'm CineSuggest AI. Ask me for movie recommendations, trivia, or anything film-related!" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Pagination and Refetching State
  const [currentPage, setCurrentPage] = useState(1);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [lastSearchTerms, setLastSearchTerms] = useState<string[]>([]);
  const isInitialRender = useRef(true);
  const isNewSearchStarting = useRef(false);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    setError(`An error occurred: ${message}`);
    console.error(err);
    setIsLoading(false);
    setIsPaginating(false);
    setIsDetailLoading(false);
  };
  
  const processAndSetResults = useCallback(async (newResults: TMDbResult[], existingResults: TMDbResult[] = []) => {
      const resultsWithProvidersPromises = newResults.map(async (result) => {
        if (!result || !result.id) return result;
        const providers = await getWatchProviders(result.media_type, result.id, region);
        return { ...result, watchProviders: providers };
      });
      
      const enrichedNewResults = await Promise.all(resultsWithProvidersPromises);

      const combined = [...existingResults, ...enrichedNewResults];
      const uniqueResultsMap = new Map<string, TMDbResult>();
      combined.forEach(result => {
        if (result && result.id) { 
          uniqueResultsMap.set(`${result.media_type}-${result.id}`, result);
        }
      });
      const uniqueResults = Array.from(uniqueResultsMap.values());
      setResults(uniqueResults);

      setCanLoadMore(newResults.length > 0);
  }, [region]);
  
  const startNewFetch = useCallback(async () => {
    if (view === 'favorites' || view === 'results') return;
    setCurrentPage(1);
    setResults([]);
    setCanLoadMore(true);
    setIsLoading(true);
    setError(null);

    try {
        if (view === 'trending') {
            const trendingResults = await getTrending(1, language);
            await processAndSetResults(trendingResults, []);
        }
    } catch (err) {
        handleError(err);
    } finally {
        setIsLoading(false);
    }
  }, [view, language, processAndSetResults]);

  // Effect to handle refetching when language changes
  useEffect(() => {
    if (isInitialRender.current) return;
    if (isNewSearchStarting.current) return;
    startNewFetch();
  }, [language, startNewFetch]);

  // Initial load effect
  useEffect(() => {
    const initialFetch = async () => {
      let langCodeToUse = language;
      let regionToUse = region;

      if (!localStorage.getItem('cinesuggest_language')) {
        const browserLang = navigator.language;
        const matchedLang = SUPPORTED_LANGUAGES.find(l => l.code === browserLang) 
                         || SUPPORTED_LANGUAGES.find(l => l.code.startsWith(browserLang.split('-')[0]))
                         || SUPPORTED_LANGUAGES[0];
        
        setLanguage(matchedLang.code);
        setRegion(matchedLang.region);
        langCodeToUse = matchedLang.code;
        regionToUse = matchedLang.region;
      }

      setIsLoading(true);
      setLoaderMessage('Fetching trending titles...');
      setError(null);
      
      try {
        const trendingResults = await getTrending(1, langCodeToUse);
        
        const resultsWithProvidersPromises = trendingResults.map(async (result) => {
          if (!result || !result.id) return result;
          const providers = await getWatchProviders(result.media_type, result.id, regionToUse);
          return { ...result, watchProviders: providers };
        });
        const enrichedNewResults = await Promise.all(resultsWithProvidersPromises);

        const uniqueResultsMap = new Map<string, TMDbResult>();
        enrichedNewResults.forEach(result => {
          if (result && result.id) { 
            uniqueResultsMap.set(`${result.media_type}-${result.id}`, result);
          }
        });
        
        setResults(Array.from(uniqueResultsMap.values()));
        setCanLoadMore(enrichedNewResults.length >= TMDB_PAGE_SIZE);
      } catch (err) { 
        handleError(err); 
      } finally { 
        setIsLoading(false); 
        isInitialRender.current = false;
      }
    };

    initialFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSearch = useCallback(async (query: string, imageFile?: File) => {
    if (!query.trim() && !imageFile) return;

    handleCloseDetailView();
    isNewSearchStarting.current = true;
    setIsLoading(true);
    setError(null);
    setResults([]);
    setView('results');
    setHasSearched(true);
    setCurrentPage(1);
    setSortOption('rating');
    setFilterOption('all');

    if (query && !history.includes(query)) {
        setHistory(prev => [query, ...prev.slice(0, 9)]);
    }

    try {
        setLoaderMessage('AI is identifying the best search strategy...');
        let searchTerms: string[] = [];

        if (imageFile) {
            setLoaderMessage('AI is analyzing your image...');
            const imageBase64 = await fileToBase64(imageFile);
            const visualSearchResponse = await getVisualSearchResultsFromAI(imageBase64, imageFile.type, query);

            if (visualSearchResponse.title) {
                searchTerms = [visualSearchResponse.title];
            } else if (visualSearchResponse.search_terms) {
                searchTerms = visualSearchResponse.search_terms.split('|').map(term => term.trim()).filter(Boolean);
            } else {
                 throw new Error("The AI Investigator couldn't identify the image. Please try another one or a text search.");
            }
        } else {
            setLoaderMessage('AI is crafting the perfect search...');
            const aiResponse = await getTextSearchTermsFromAI(query);
            setLoaderMessage(aiResponse.pregunta);
            searchTerms = aiResponse.terminos_busqueda.split('|').map(term => term.trim()).filter(Boolean);
        }
        
        setLastSearchTerms(searchTerms);
        
        const searchPromises = searchTerms.map(term => searchMedia(term, 1, language));
        const searchResultsArrays = await Promise.all(searchPromises);
        const allResults = searchResultsArrays.flat();
        
        setLoaderMessage('Curating and ranking top results...');

        const uniqueResultsMap = new Map<number, TMDbResult>();
        allResults.forEach(item => {
            if (item?.id && !uniqueResultsMap.has(item.id)) {
                uniqueResultsMap.set(item.id, item);
            }
        });
        const uniqueResults = Array.from(uniqueResultsMap.values());
        
        await processAndSetResults(uniqueResults, []);
        
        setCanLoadMore(true);

    } catch (err) {
        handleError(err);
    } finally {
        setIsLoading(false);
        isNewSearchStarting.current = false;
    }
  }, [history, setHistory, processAndSetResults, language]);
  
  const handleLoadMore = async () => {
    if (isPaginating || !canLoadMore) return;
    
    setIsPaginating(true);
    const nextPage = currentPage + 1;
    
    try {
      if (view === 'trending') {
        const newResults = await getTrending(nextPage, language);
        await processAndSetResults(newResults, results);
        setCurrentPage(nextPage);
      } else if (view === 'results' && lastSearchTerms.length > 0) {
        const searchPromises = lastSearchTerms.map(term => searchMedia(term, nextPage, language));
        const searchResultsArrays = await Promise.all(searchPromises);
        const rawNewResults = searchResultsArrays.flat();

        const uniqueNewResultsMap = new Map<number, TMDbResult>();
        rawNewResults.forEach(item => {
            if (item?.id && !uniqueNewResultsMap.has(item.id)) {
                uniqueNewResultsMap.set(item.id, item);
            }
        });
        const uniqueNewResults = Array.from(uniqueNewResultsMap.values());
        
        await processAndSetResults(uniqueNewResults, results);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsPaginating(false);
    }
  };

  const handleToggleFavorite = (item: TMDbResult) => {
    const favoriteId = `${item.media_type}:${item.id}`;
    if (favorites.includes(favoriteId)) {
      setFavorites(prev => prev.filter(id => id !== favoriteId));
    } else {
      setFavorites(prev => [...prev, favoriteId]);
    }
  };
  
  const handleViewChange = async (newView: View) => {
      handleCloseDetailView();
      setView(newView);
      setHasSearched(false);
      setCanLoadMore(true);
      setResults([]);
      setCurrentPage(1);
      setLastSearchTerms([]);

      if (newView === 'trending') {
        setSortOption('popularity');
        setFilterOption('all');
        setIsLoading(true);
        try {
            const trendingResults = await getTrending(1, language);
            await processAndSetResults(trendingResults, []);
        } catch(err) {
            handleError(err);
        } finally {
            setIsLoading(false);
        }
      } else if (newView === 'favorites') {
        setCanLoadMore(false);
        showFavorites();
      }
  }

  const showFavorites = useCallback(async () => {
    setIsLoading(true);
    setLoaderMessage('Loading your favorites...');
    setError(null);
    try {
        const favoriteDetailsPromises = favorites.map(favId => {
            const [mediaType, id] = favId.split(':');
            return getMediaDetails(mediaType as 'movie' | 'tv', parseInt(id, 10), language);
        });
        const favoriteItems = (await Promise.all(favoriteDetailsPromises)).filter(Boolean) as TMDbResult[];
        await processAndSetResults(favoriteItems, []);
    } catch (err) {
        handleError(err);
    } finally {
        setIsLoading(false);
    }
  }, [favorites, language, processAndSetResults]);

  const handleViewDetails = (item: TMDbResult) => {
    setSelectedItem(item);
  }
  
  const handleCloseDetailView = () => {
      setSelectedItem(null);
      setDetailedData(null);
  }
  
  const handleLanguageChange = (langCode: string) => {
    const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (selectedLang) {
        setLanguage(selectedLang.code);
        setRegion(selectedLang.region);
    }
  }

  useEffect(() => {
    if (!selectedItem) {
        setDetailedData(null);
        return;
    }

    const fetchAllDetails = async () => {
      setIsDetailLoading(true);
      setError(null);
      setDetailedData(null);
      
      try {
        const [details, providers, similar, recommendations] = await Promise.all([
          getMediaDetails(selectedItem.media_type, selectedItem.id, language),
          getWatchProviders(selectedItem.media_type, selectedItem.id, region),
          getSimilarMedia(selectedItem.media_type, selectedItem.id, language),
          getRecommendedMedia(selectedItem.media_type, selectedItem.id, language)
        ]);

        if (!details) {
          throw new Error("Could not fetch media details.");
        }
        
        const combinedSimilar = [...(similar || []), ...(recommendations || [])];
        const uniqueSimilarMap = new Map<number, TMDbResult>();
        combinedSimilar.forEach(item => {
            if (item.id !== selectedItem.id) {
                uniqueSimilarMap.set(item.id, item);
            }
        });
        
        const uniqueSimilar = Array.from(uniqueSimilarMap.values());

        // Implement quality filtering and sorting for recommendations
        const qualitySimilar = uniqueSimilar
          .filter(item => item.vote_count > 500 && item.vote_average > 6.5)
          .sort((a, b) => {
            if (a.vote_average !== b.vote_average) {
              return b.vote_average - a.vote_average;
            }
            return b.popularity - a.popularity;
          });

        setDetailedData({
          ...details,
          watchProviders: providers,
          similar: qualitySimilar.slice(0, 20),
        });
      } catch (err) {
        handleError(err);
      } finally {
        setIsDetailLoading(false);
      }
    };

    fetchAllDetails();
  }, [selectedItem, language, region]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isChatLoading) return;
    
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: message }];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    try {
        setChatMessages(prev => [...prev, { role: 'ai', content: '' }]);

        const stream = getChatResponseFromAIStream(newMessages);
        for await (const chunk of stream) {
            setChatMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage?.role === 'ai') {
                    const updatedMessages = [...prev.slice(0, -1)];
                    updatedMessages.push({ ...lastMessage, content: lastMessage.content + chunk });
                    return updatedMessages;
                }
                return prev;
            });
        }
    } catch (err) {
        setChatMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'ai' && lastMessage.content === '') {
                 const updatedMessages = [...prev.slice(0, -1)];
                 updatedMessages.push({ role: 'error', content: 'Sorry, I ran into a problem. Please try again.' });
                 return updatedMessages;
            }
            return [...prev, { role: 'error', content: 'Sorry, I ran into a problem. Please try again.' }];
        });
        console.error(err);
    } finally {
        setIsChatLoading(false);
    }
  };

  const displayedResults = useMemo(() => {
    let sortedAndFiltered = [...results];
    
    if (filterOption !== 'all') {
        sortedAndFiltered = sortedAndFiltered.filter(r => r.media_type === filterOption);
    }
    
    if (view === 'results') {
        sortedAndFiltered.sort((a, b) => {
            if (a.vote_average !== b.vote_average) {
                return b.vote_average - a.vote_average;
            }
            return b.popularity - a.popularity;
        });
    } else {
      switch(sortOption) {
          case 'release_date':
              sortedAndFiltered.sort((a, b) => {
                  const dateA = new Date(a.release_date || a.first_air_date || 0).getTime();
                  const dateB = new Date(b.release_date || b.first_air_date || 0).getTime();
                  return dateB - dateA;
              });
              break;
          case 'rating':
              sortedAndFiltered.sort((a, b) => b.vote_average - a.vote_average);
              break;
          case 'popularity':
          default:
              sortedAndFiltered.sort((a, b) => b.popularity - a.popularity);
              break;
      }
    }


    return sortedAndFiltered.map(r => ({
      ...r,
      isFavorite: favorites.includes(`${r.media_type}:${r.id}`)
    }));
  }, [results, sortOption, filterOption, favorites, view]);

  const showFilterControls = view === 'trending' || (view === 'results' && results.length > 0);

  return (
    <>
      {!hasSeenInstructions && (
        <InstructionsModal onClose={() => setHasSeenInstructions(true)} />
      )}
      <div className="min-h-screen flex flex-col">
        <Header 
            onViewChange={handleViewChange} 
            language={language}
            onLanguageChange={handleLanguageChange}
            currentView={view}
        />
        <main className="container mx-auto px-4 py-8 flex-grow">
          <SearchBar 
            onSearch={handleSearch} 
            isLoading={isLoading} 
          />
          <History items={history} onSearch={(q) => handleSearch(q)} onClear={() => setHistory([])} />

          {showFilterControls && (
              <div className="my-8 flex justify-center">
                  <FilterControls 
                      sortOption={sortOption}
                      filterOption={filterOption}
                      onSortChange={setSortOption}
                      onFilterChange={setFilterOption}
                      showSortControls={view !== 'results'}
                  />
              </div>
          )}
          
          {error && <p className="text-red-500 text-center mt-8">{error}</p>}
          
          <div className="mt-8">
            {isLoading ? (
              <Loader message={loaderMessage} />
            ) : results.length > 0 ? (
              <ResultsGrid 
                results={displayedResults} 
                onToggleFavorite={handleToggleFavorite} 
                onLoadMore={handleLoadMore}
                canLoadMore={canLoadMore}
                isPaginating={isPaginating}
                onViewDetails={handleViewDetails}
              />
            ) : hasSearched ? (
              <EmptyState />
            ) : view !== 'favorites' ? ( 
              <Welcome />
            ) : (
              <p className="text-center text-text-secondary mt-16">You haven't added any favorites yet.</p>
            )
            }
          </div>
        </main>

        <DetailView 
          item={detailedData}
          isOpen={!!selectedItem}
          isLoading={isDetailLoading}
          onClose={handleCloseDetailView}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={selectedItem ? favorites.includes(`${selectedItem.media_type}:${selectedItem.id}`) : false}
          onSelectSimilar={handleViewDetails}
          favorites={favorites}
        />
        <ChatView 
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
        />
        {!isChatOpen && (
            <button 
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-brand-accent to-orange-500 text-white rounded-full p-4 shadow-lg hover:scale-110 transform transition-transform duration-300 z-20"
                aria-label="Open chat"
            >
                <ChatIcon />
            </button>
        )}
      </div>
    </>
  );
};

export default App;