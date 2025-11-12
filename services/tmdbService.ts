
import { TMDB_API_KEY, TMDB_API_BASE_URL } from '../constants';
import { TMDbResponse, TMDbResult, WatchProviderResponse, ProviderInfo } from '../types';

const fetchFromTMDb = async <T,>(endpoint: string, language: string = 'en-US'): Promise<T> => {
  const url = `${TMDB_API_BASE_URL}/${endpoint}`;
  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = `${url}${separator}api_key=${TMDB_API_KEY}&language=${language}`;

  try {
    const response = await fetch(finalUrl);
    if (!response.ok) {
      throw new Error(`TMDb API request failed for ${endpoint} with status ${response.status}`);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`Error fetching from TMDb endpoint ${endpoint}:`, error);
    throw new Error(`Failed to fetch data from TMDb for ${endpoint}.`);
  }
};

export const getTrending = async (page: number = 1, language: string): Promise<TMDbResult[]> => {
  const data = await fetchFromTMDb<TMDbResponse>(`trending/all/week?page=${page}`, language);
  return data.results.filter(result => (result.media_type === 'movie' || result.media_type === 'tv') && result.poster_path);
};

export const searchMedia = async (query: string, page: number = 1, language: string): Promise<TMDbResult[]> => {
    const data = await fetchFromTMDb<TMDbResponse>(`search/multi?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`, language);
    return data.results.filter(result => (result.media_type === 'movie' || result.media_type === 'tv') && result.poster_path);
};

export const getMediaDetails = async (mediaType: 'movie' | 'tv', id: number, language: string): Promise<TMDbResult | null> => {
    if (!mediaType || !id) return null;
    const data = await fetchFromTMDb<TMDbResult>(`${mediaType}/${id}?append_to_response=genres`, language);
    return { ...data, media_type: mediaType };
};

export const getSimilarMedia = async (mediaType: 'movie' | 'tv', id: number, language: string): Promise<TMDbResult[]> => {
    if (!mediaType || !id) return [];
    const data = await fetchFromTMDb<TMDbResponse>(`${mediaType}/${id}/similar`, language);
    return data.results.filter(result => result.poster_path).map(r => ({ ...r, media_type: mediaType }));
};

export const getRecommendedMedia = async (mediaType: 'movie' | 'tv', id: number, language: string): Promise<TMDbResult[]> => {
    if (!mediaType || !id) return [];
    const data = await fetchFromTMDb<TMDbResponse>(`${mediaType}/${id}/recommendations`, language);
    return data.results.filter(result => result.poster_path).map(r => ({ ...r, media_type: mediaType }));
};

export const getWatchProviders = async (mediaType: 'movie' | 'tv', id: number, region: string): Promise<ProviderInfo | null> => {
    if (!mediaType || !id || !region) return null;
    const data = await fetchFromTMDb<WatchProviderResponse>(`${mediaType}/${id}/watch/providers`);
    return data.results?.[region] || null;
};
