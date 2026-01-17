import { vintageTheme, vintageColors } from './vintageTheme';
import { darkTheme, darkColors } from './darkTheme';
import { nodeStyles, createEdgeStyles, createFlowBackgroundConfig } from './sharedStyles';

// Available themes
export const THEMES = {
  VINTAGE: 'vintage',
  DARK: 'dark',
};

// Theme configurations
const themeConfigs = {
  [THEMES.VINTAGE]: {
    muiTheme: vintageTheme,
    colors: vintageColors,
    nodeStyles: { ...nodeStyles.base, ...nodeStyles.vintage },
    selectedStyles: nodeStyles.selected.vintage,
  },
  [THEMES.DARK]: {
    muiTheme: darkTheme,
    colors: darkColors,
    nodeStyles: nodeStyles.base,
    selectedStyles: nodeStyles.selected.dark,
  },
};

// Get theme configuration
export const getThemeConfig = (themeName = THEMES.VINTAGE) => {
  const config = themeConfigs[themeName];
  
  return {
    muiTheme: config.muiTheme,
    colors: config.colors,
    nodeStyles: config.nodeStyles,
    selectedStyles: config.selectedStyles,
    edgeStyles: createEdgeStyles(config.colors),
    flowBackgroundConfig: createFlowBackgroundConfig(config.colors),
  };
};

// Default export
export default getThemeConfig;

// Named exports for convenience
export { nodeStyles } from './sharedStyles';
export { vintageTheme, vintageColors } from './vintageTheme';
export { darkTheme, darkColors } from './darkTheme';