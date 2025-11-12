import React from 'react';

const ApiKeyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-brand-accent mx-auto" aria-hidden="true">
        <path fillRule="evenodd" d="M15.75 1.5a.75.75 0 0 1 .75.75V4.5h.75a3 3 0 0 1 3 3v10.5a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3h.75V2.25a.75.75 0 0 1 1.5 0V4.5h9V2.25a.75.75 0 0 1 .75-.75Zm-3 6a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Zm-6 0a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Zm3 0a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
    </svg>
);


export const ApiKeyGate: React.FC<{ onKeySelected: () => void; error?: string | null }> = ({ onKeySelected, error }) => {

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            // Optimistically assume the user selected a key.
            onKeySelected();
        } catch (error) {
            console.error("Error opening API key selection dialog:", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
            <div className="bg-base-200 w-full max-w-lg p-8 rounded-2xl shadow-2xl border border-base-300 text-center animate-fade-in">
                <ApiKeyIcon />
                <h1 className="text-3xl font-extrabold tracking-tight text-text-primary mt-6 mb-4">
                    Welcome to CineSuggest AI
                </h1>
                <p className="text-text-secondary mb-8">
                    To use the AI-powered features of this app, you need to select a Google AI API key. Your key is stored securely and is only used to communicate with the Gemini API.
                </p>
                {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-lg mb-6">{error}</p>}
                <button
                    onClick={handleSelectKey}
                    className="w-full bg-gradient-to-r from-brand-accent to-orange-500 text-white font-bold py-3 px-8 rounded-full hover:scale-105 transform transition-transform duration-300"
                >
                    Select Your API Key
                </button>
                <p className="text-xs text-text-secondary mt-6">
                    Using the Google AI API may incur costs. Please review the 
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline ml-1">
                        billing documentation
                    </a> for details.
                </p>
            </div>
             <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
