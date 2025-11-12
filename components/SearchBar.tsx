
import React, { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string, imageFile?: File) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!imageFile) {
        setImagePreview(null);
        return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    // free memory when ever this component is unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query, imageFile);
  };

  const handleClear = () => {
      setQuery('');
      inputRef.current?.focus();
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setImageFile(e.target.files[0]);
    }
  }

  const handleRemoveImage = () => {
      setImageFile(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  return (
    <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe a movie or series, or search by image..."
                  disabled={isLoading}
                  className={`w-full pl-5 pr-48 py-4 text-lg text-text-primary bg-base-200 border-2 border-base-300 rounded-full focus:ring-2 focus:ring-brand-accent focus:outline-none transition-all duration-300 disabled:opacity-50 ${imagePreview ? 'pl-20' : 'pl-5'}`}
                  aria-label="Search for movies and series"
                />
                
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    aria-label="Upload image for visual search"
                />

                {imagePreview && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                        <div className="relative">
                            <img src={imagePreview} alt="Selected preview" className="w-12 h-12 rounded-full object-cover" />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute -top-1 -right-1 bg-base-100 rounded-full text-text-secondary hover:text-white"
                                aria-label="Remove selected image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.707-10.707a1 1 0 0 0-1.414-1.414L10 8.586 7.707 6.293a1 1 0 0 0-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 1 0 1.414 1.414L10 11.414l2.293 2.293a1 1 0 0 0 1.414-1.414L11.414 10l2.293-2.293Z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                     {query && !isLoading && !imageFile && (
                        <button type="button" onClick={handleClear} className="text-text-secondary hover:text-text-primary" aria-label="Clear search">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16Zm3.707-10.707a1 1 0 0 0-1.414-1.414L10 8.586 7.707 6.293a1 1 0 0 0-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 1 0 1.414 1.414L10 11.414l2.293 2.293a1 1 0 0 0 1.414-1.414L11.414 10l2.293-2.293Z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="text-text-secondary hover:text-brand-accent transition-colors p-2 rounded-full disabled:opacity-50"
                      aria-label="Search by image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                        <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.452.242 2.753 1.226 3.004 2.67.114 1.036.011 2.281-.544 3.39-.465.9 0 1.943.486 2.464.486.52.887 1.366 1.145 2.23.114.383.227.766.321 1.149.094.382.162.78.196 1.183.036.403.018.816-.07 1.21-.194.896-.98 1.57-1.932 1.57h-1.618c-.484 0-.946-.192-1.284-.53l-.821-1.317a3.25 3.25 0 0 0-1.11-.71c-.386-.054-.77-.113-1.152-.177-1.452-.242-2.753-1.226-3.004-2.67-.114-1.036-.011-2.281.544-3.39.465-.9 0-1.943-.486-2.464-.486-.52-.887-1.366-1.145-2.23-.114-.383-.227-.766-.321-1.149-.094-.382-.162-.78-.196-1.183.036-.403.018-.816.07-1.21.194-.896.98-1.57 1.932-1.57h1.618c.484 0 .946.192 1.284.53l.821 1.317a3.25 3.25 0 0 0 1.11-.71Z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-brand-accent to-orange-500 text-white font-bold py-2 px-6 rounded-full hover:scale-105 transform transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {isLoading ? '...' : 'Search'}
                    </button>
                </div>
            </div>
        </form>
    </div>
  );
};