import { createTheme } from '@mui/material/styles';

// Palette inspired by the College of Winterhold: frostbitten blues, aurora
// teal, old gold trim, and the deep near-black stone of the Hall of the
// Elements at night.
const frost = {
  50: '#eef7fc',
  100: '#d3ecf7',
  200: '#a7d9ef',
  300: '#7bc6e7',
  400: '#57b6e0',
  500: '#3fa3d1',
  600: '#2f84ab',
  700: '#276c8b',
  800: '#1f5670',
  900: '#153c4e',
};

const gold = {
  light: '#e9d9a8',
  main: '#c9a94f',
  dark: '#9a7f34',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: frost[400],
      light: frost[200],
      dark: frost[700],
      contrastText: '#04141c',
    },
    secondary: {
      main: gold.main,
      light: gold.light,
      dark: gold.dark,
      contrastText: '#1a1305',
    },
    background: {
      default: '#0a0f14',
      paper: '#11181f',
    },
    text: {
      primary: '#e7f1f7',
      secondary: '#9fb3c2',
    },
    divider: 'rgba(201,169,79,0.25)',
    error: { main: '#e0554f' },
    warning: { main: '#d99a3f' },
    success: { main: '#5fae7c' },
    info: { main: frost[300] },
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: '"EB Garamond", "Georgia", serif',
    h1: { fontFamily: '"Cinzel", serif', fontWeight: 600, letterSpacing: '0.03em' },
    h2: { fontFamily: '"Cinzel", serif', fontWeight: 600, letterSpacing: '0.03em' },
    h3: { fontFamily: '"Cinzel", serif', fontWeight: 600, letterSpacing: '0.02em' },
    h4: { fontFamily: '"Cinzel", serif', fontWeight: 600, letterSpacing: '0.02em' },
    h5: { fontFamily: '"Cinzel", serif', fontWeight: 600 },
    h6: { fontFamily: '"Cinzel", serif', fontWeight: 600 },
    button: { fontFamily: '"Cinzel", serif', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(ellipse at top, rgba(63,163,209,0.08), transparent 60%), radial-gradient(ellipse at bottom, rgba(201,169,79,0.05), transparent 55%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(201,169,79,0.18)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0d141b',
          borderBottom: '1px solid rgba(201,169,79,0.35)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
        },
        containedPrimary: {
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Cinzel", serif',
          letterSpacing: '0.02em',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontFamily: '"Cinzel", serif',
            color: gold.light,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            borderBottom: '1px solid rgba(201,169,79,0.35)',
          },
        },
      },
    },
  },
});

export default theme;

// Ranks recognised by the College, lowest to highest.
export const RANKS = ['Novice', 'Apprentice', 'Adept', 'Expert'];

// The five schools of magic taught at the College of Winterhold.
export const SCHOOLS = ['Alteration', 'Conjuration', 'Destruction', 'Illusion', 'Restoration'];

// The two kinds of session a class can be logged as.
export const CLASS_TYPES = ['Expedition', 'Lecture'];

// How demanding a class is.
export const CLASS_DIFFICULTIES = ['Regular', 'Advanced'];

export const RANK_COLORS = {
  Novice: frost[700],
  Apprentice: frost[500],
  Adept: gold.dark,
  Expert: gold.main,
};
