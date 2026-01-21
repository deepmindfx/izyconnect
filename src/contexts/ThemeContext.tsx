import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    // Default to dark mode
    const [theme, setThemeState] = useState<Theme>('dark');
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize theme from local storage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            setThemeState(savedTheme);
        } else {
            // Default to dark if no preference saved
            setThemeState('dark');
            localStorage.setItem('theme', 'dark');
        }
        setIsLoaded(true);
    }, []);

    // Sync with Supabase profile when user logs in
    useEffect(() => {
        const syncThemeWithProfile = async () => {
            if (!user) return;

            try {
                // Fetch user's theme preference from DB
                const { data, error } = await supabase
                    .from('profiles')
                    .select('theme')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    // If column doesn't exist or error, just use local
                    console.warn('Error fetching theme preference:', error);
                    return;
                }

                if (data?.theme) {
                    const dbTheme = data.theme as Theme;
                    // specific check to avoid unnecessary state updates/renders
                    if (dbTheme !== theme) {
                        setThemeState(dbTheme);
                        localStorage.setItem('theme', dbTheme);
                    }
                } else {
                    // If no theme in DB, save current local theme to DB
                    await supabase
                        .from('profiles')
                        .update({ theme: theme })
                        .eq('id', user.id);
                }
            } catch (err) {
                console.error('Failed to sync theme:', err);
            }
        };

        if (isLoaded && user) {
            syncThemeWithProfile();
        }
    }, [user, isLoaded]); // Re-run when user changes (login/logout) specifically

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);

        // Update HTML class for Tailwind dark mode if using 'class' strategy (optional but good practice)
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Persist to Supabase if logged in
        if (user) {
            try {
                await supabase
                    .from('profiles')
                    .update({ theme: newTheme })
                    .eq('id', user.id);
            } catch (err) {
                console.error('Error saving theme preference:', err);
            }
        }
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        if (user) {
            supabase.from('profiles').update({ theme: newTheme }).eq('id', user.id).then(({ error }) => {
                if (error) console.error('Error updating theme:', error);
            });
        }
    };

    // Apply document class effect
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);


    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
