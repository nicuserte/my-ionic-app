import { useCamera } from '@ionic/react-hooks/camera';
import { CameraPhoto, CameraResultType, CameraSource, FilesystemDirectory } from '@capacitor/core';
import { useEffect, useState } from 'react';
import { base64FromPath, useFilesystem } from '@ionic/react-hooks/filesystem';
import { useStorage } from '@ionic/react-hooks/storage';
import {getLogger} from "./index";

export interface Photo {
  filepath: string;
  webviewPath?: string;
}

const PHOTO_STORAGE = 'photos';

export function usePhotoGallery() {
  const { getPhoto } = useCamera();
  const [photos, setPhotos] = useState<Photo[]>([]);

  const takePhoto = async () => {
    const cameraPhoto = await getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });
    const fileName = new Date().getTime() + '.jpeg';
    const savedFileImage = await savePicture(cameraPhoto, fileName);
    console.log("picture: "+JSON.stringify(savedFileImage));
    const newPhotos = [savedFileImage, ...photos];
    setPhotos(newPhotos);
    set(PHOTO_STORAGE, JSON.stringify(newPhotos));
    return savedFileImage;
  };

  const { deleteFile, readFile, writeFile } = useFilesystem();
  const savePicture = async (photo: CameraPhoto, fileName: string): Promise<Photo> => {
    const base64Data = await base64FromPath(photo.webPath!);
    await writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data
    });

    return {
      filepath: fileName,
      webviewPath: base64Data
    };
  };

  const { get, set } = useStorage();
  useEffect(() => {
    const loadSaved = async () => {
      const log = getLogger('loadSaved');
      const photosString = await get(PHOTO_STORAGE);
      const photos = (photosString ? JSON.parse(photosString) : []) as Photo[];
      for (let photo of photos) {
        try{
          log(photo);
          const file = await readFile({
            path: photo.filepath,
            directory: FilesystemDirectory.Data
          });
          photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
        }catch (e){
          log('File does not exist');
        }
      }
      setPhotos(photos);
    };
    loadSaved();
  }, [get, readFile]);

  const deletePhoto = async (photo: Photo) => {
    const newPhotos = photos.filter(p => p.filepath !== photo.filepath);
    set(PHOTO_STORAGE, JSON.stringify(newPhotos));
    const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
    await deleteFile({
      path: filename,
      directory: FilesystemDirectory.Data
    });
    setPhotos(newPhotos);
  };

  return {
    photos,
    takePhoto,
    deletePhoto,
  };
}