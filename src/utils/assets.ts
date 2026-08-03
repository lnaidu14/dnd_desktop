import { mkdir, exists, copyFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";

export async function getImageSize(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();

    img.onload = () =>
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });

    img.onerror = reject;
    img.src = url;
  });
}

// Copy selected image file into AppData/assets/maps/ and return relative path
export async function saveMapAsset(sourceFilePath: string): Promise<string> {
  const mapsDirExists = await exists("assets/maps", {
    baseDir: BaseDirectory.AppData,
  });

  if (!mapsDirExists) {
    await mkdir("assets/maps", {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    });
  }

  // Extract original filename or generate a clean target name
  const fileName =
    sourceFilePath.split(/[/\\]/).pop() || `map_${Date.now()}.png`;
  const relativeDestination = `assets/maps/${Date.now()}_${fileName}`;

  // Copy file from original location to AppData/assets/maps/
  await copyFile(sourceFilePath, relativeDestination, {
    toPathBaseDir: BaseDirectory.AppData,
  });

  return relativeDestination;
}

// Convert a relative path (e.g. "assets/maps/xxx.png") to an image src URL
export async function getAssetUrl(relativePath: string): Promise<string> {
  const appData = await appDataDir();

  // Clean leading slashes/backslashes to avoid path duplication
  const cleanRelativePath = relativePath.replace(/^[/\\]+/, "");
  const fullPath = await join(appData, cleanRelativePath);
  console.log("fullPath: ", convertFileSrc(fullPath))
  return convertFileSrc(fullPath);
}

// Copy selected token file into AppData/assets/tokens/ and return relative path
export async function saveTokenAsset(sourceFilePath: string): Promise<string> {
  const tokensDirExists = await exists("assets/tokens", {
    baseDir: BaseDirectory.AppData,
  });

  if (!tokensDirExists) {
    await mkdir("assets/tokens", {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    });
  }

  const fileName =
    sourceFilePath.split(/[/\\]/).pop() || `token_${Date.now()}.png`;
  const relativeDestination = `assets/tokens/${fileName}`;

  const alreadyExists = await exists(relativeDestination, {
    baseDir: BaseDirectory.AppData,
  });

  if (alreadyExists) {
    throw new Error(`Token "${fileName}" has already been imported.`);
  }

  await copyFile(sourceFilePath, relativeDestination, {
    toPathBaseDir: BaseDirectory.AppData,
  });

  return relativeDestination;
}
