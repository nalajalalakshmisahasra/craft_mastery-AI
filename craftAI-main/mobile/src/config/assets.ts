import { ImageSourcePropType } from 'react-native';

/**
 * Official Craft Mastery Brand Assets
 * Configured as a centralized asset reference so logos and illustrations
 * can be updated or swapped without touching screen architecture or layouts.
 */
export const BRAND_ASSETS: {
  logo: ImageSourcePropType;
} = {
  logo: require('../../assets/logo.png'),
};
