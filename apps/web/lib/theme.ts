import {
  Button,
  createTheme,
  Input,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core';

const brand: MantineColorsTuple = [
  '#f0f7f3', // [0]
  '#dff4e8', // [1]
  '#c4ebe0', // [2]
  '#96dcc9', // [3]
  '#68c174', // [4]
  '#52b55d', // [5] --green (primary accent)
  '#44a050', // [6]
  '#368942', // [7] --darker-green
  '#2a6e35', // [8]
  '#1f5329', // [9]
];

export const theme = createTheme({
  primaryColor: 'brand',
  defaultRadius: 'sm',
  fontFamily: 'var(--font-space-grotesk), sans-serif',
  headings: {
    fontFamily: 'var(--font-space-mono), monospace',
    fontWeight: '700',
  },
  fontSizes: {
    xs: '14px',
    sm: '16px',
    md: '18px',
    lg: '20px',
    xl: '22px',
  },

  colors: {
    brand,
    dark: [
      '#f2f5f7', // [0] text primary
      '#cbd5dc', // [1] text muted
      '#8a95a3', // [2] text dimmed
      '#5a6b79', // [3] border active
      '#404d57', // [4] border default
      '#303844', // [5] surface hover
      '#252d37', // [6] surface / nav active bg
      '#1a2129', // [7] card bg
      '#10141a', // [8] page background
      '#0a0d10', // [9] deepest bg
    ],
  },

  components: {
    Button: Button.extend({
      defaultProps: { variant: 'outline' },
      vars: () => ({
        root: {
          '--button-color': '#68c174',
          '--button-bd': '1.5px solid #68c174',
          '--button-bg': 'transparent',
          '--button-hover': '#68c174',
          '--button-hover-color': '#0a0d10',
        },
      }),
    }),

    Input: Input.extend({
      vars: () => ({
        wrapper: {
          '--input-height': '36px',
        },
      }),
      styles: () => ({
        input: {
          backgroundColor: 'transparent',
          border: '1px solid #68c17440',
          color: '#f2f5f7',
          '&::placeholder': {
            color: '#8a95a3',
          },
        },
      }),
    }),
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const cssVariablesResolver: CSSVariablesResolver = (_theme) => {
  const shared = {
    '--mantine-color-body': '#10141a',
    '--mantine-color-default': '#1a2129',
    '--mantine-color-default-border': '#303844',
    '--mantine-color-dimmed': '#8a95a3',
  };
  return {
    variables: {},
    light: shared,
    dark: shared,
  };
};

export const PRIMARY = '#68c174';
export const BG = '#10141a';
export const SURFACE = '#1a2129';
export const CARD = '#1a2129';
export const CARD_BORDER = '#68c17420';
export const CARD_BORDER_HOVER = '#68c17445';
export const BORDER = '#303844';
export const TEXT = '#f2f5f7';
export const MUTED = '#8a95a3';
export const HEADING = 'var(--font-space-mono), monospace';
export const SANS = 'var(--font-space-grotesk), sans-serif';
