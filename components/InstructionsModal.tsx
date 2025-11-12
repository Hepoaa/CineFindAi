import React from 'react';

const BotIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-brand-accent" aria-hidden="true">
        <path fillRule="evenodd" d="M5.337 21.063a.75.75 0 0 1-.613.882c-1.34.22-2.58.6-3.737 1.125a.75.75 0 0 1-1.002-.873 11.233 11.233 0 0 1 2.25-5.223.75.75 0 0 1 .43-.33L3 16.5c-1.468-1.468-2.25-3.41-2.25-5.437 0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5c0 4.142-4.03 7.5-9 7.5a10.02 10.02 0 0 1-5.337-1.563Z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M15.75 8.25a.75.75 0 0 1 .75.75v5.13l1.19-1.19a.75.75 0 0 1 1.06 1.06l-2.5 2.5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06l1.19 1.19V9a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
);

const CameraIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-brand-accent" aria-hidden="true">
        <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
        <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.452.242 2.753 1.226 3.004 2.67.114 1.036.011 2.281-.544 3.39-.465.9 0 1.943.486 2.464.486.52.887 1.366 1.145 2.23.114.383.227.766.321 1.149.094.382.162.78.196 1.183.036.403.018.816-.07 1.21-.194.896-.98 1.57-1.932 1.57h-1.618c-.484 0-.946-.192-1.284-.53l-.821-1.317a3.25 3.25 0 0 0-1.11-.71c-.386-.054-.77-.113-1.152-.177-1.452-.242-2.753-1.226-3.004-2.67-.114-1.036-.011-2.281.544-3.39.465.9 0-1.943-.486-2.464-.486-.52-.887 1.366 1.145-2.23-.114-.383-.227-.766-.321-1.149-.094-.382-.162-.78-.196-1.183.036-.403.018.816.07-1.21.194.896.98 1.57 1.932 1.57h1.618c.484 0 .946.192 1.284.53l.821 1.317a3.25 3.25 0 0 0 1.11-.71Z" clipRule="evenodd" />
    </svg>
);

interface InstructionsModalProps {
    onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ onClose }) => {
    return (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="instructions-title"
        >
            <div 
                className="bg-base-200 w-full max-w-md m-4 p-8 rounded-2xl shadow-2xl border border-base-300 text-center transform animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <h1 id="instructions-title" className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-accent to-orange-500 text-transparent bg-clip-text mb-4">
                    Welcome to CineSuggest AI!
                </h1>
                <p className="text-text-secondary mb-8">Here are a couple of tips to get you started:</p>
                
                <div className="space-y-6 text-left">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                            <BotIcon />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-text-primary">Find a forgotten title</h2>
                            <p className="text-text-secondary">Can't remember a name? Use the **AI Investigator** bot in the bottom-right to describe anything you recall.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                            <CameraIcon />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-text-primary">Use Visual Search</h2>
                            <p className="text-text-secondary">Got a picture? Use the **camera icon** in the search bar to find a movie from an image.</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="mt-10 w-full bg-gradient-to-r from-brand-accent to-orange-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transform transition-transform duration-300"
                >
                    Got It, Let's Go!
                </button>
            </div>
             <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                .animate-scale-in {
                    animation: scaleIn 0.3s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.95); 
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1); 
                    }
                }
            `}</style>
        </div>
    );
};