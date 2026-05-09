"use client"

import * as React from "react"

type Theme = "dark" | "light" | "system"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeContextType = {
  theme: Theme | undefined
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light" | undefined
  systemTheme: "dark" | "light" | undefined
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  attribute = "data-theme",
}: ThemeProviderProps) {
  const getSystemTheme = React.useCallback(
    (): "dark" | "light" => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    []
  )
  const getActualTheme = React.useCallback(
    (currentTheme: Theme) => currentTheme === "system" ? getSystemTheme() : currentTheme,
    [getSystemTheme]
  )

  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme
    return (localStorage.getItem(storageKey) as Theme | null) || defaultTheme
  })
  const [resolvedTheme, setResolvedTheme] = React.useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "light"
    return getActualTheme((localStorage.getItem(storageKey) as Theme | null) || defaultTheme)
  })

  React.useEffect(() => {
    const applyTheme = (currentTheme: Theme) => {
      const isSystem = currentTheme === "system"
      const systemPreference = getSystemTheme()
      const actualTheme = isSystem ? systemPreference : currentTheme
      
      setResolvedTheme(actualTheme)

      const d = document.documentElement
      if (attribute === "class") {
        d.classList.remove("light", "dark")
        d.classList.add(actualTheme)
      } else {
        d.setAttribute(attribute, actualTheme)
      }
      
      d.style.colorScheme = actualTheme
    }

    applyTheme(theme)
    localStorage.setItem(storageKey, theme)
  }, [theme, attribute, storageKey, getSystemTheme])

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        setResolvedTheme(getSystemTheme())
      }
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, getSystemTheme])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      resolvedTheme,
      systemTheme: typeof window !== 'undefined' ? getSystemTheme() : "light",
    }),
    [theme, resolvedTheme, getSystemTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
