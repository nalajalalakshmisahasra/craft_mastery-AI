import * as ImagePicker from 'expo-image-picker';

/**
 * Mobile Native Image & Media Adapter
 * Replaces browser DOM <input type="file"> and HTML5 Canvas manipulation.
 * Handles native camera and gallery permissions and image acquisition.
 */

export interface PickedImageResult {
  uri: string;
  width?: number;
  height?: number;
  base64?: string;
  cancelled: boolean;
}

export const ImageAdapter = {
  /**
   * Request camera permissions and open device camera
   */
  async captureFromCamera(): Promise<PickedImageResult> {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Camera permission not granted');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { uri: '', cancelled: true };
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined,
        cancelled: false,
      };
    } catch (err) {
      console.warn('[ImageAdapter] Camera error:', err);
      return { uri: '', cancelled: true };
    }
  },

  /**
   * Request photo library permissions and pick image from device gallery
   */
  async pickFromGallery(): Promise<PickedImageResult> {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Photo library permission not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { uri: '', cancelled: true };
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined,
        cancelled: false,
      };
    } catch (err) {
      console.warn('[ImageAdapter] Gallery picker error:', err);
      return { uri: '', cancelled: true };
    }
  },
};
