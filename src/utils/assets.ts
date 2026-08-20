import { mkdir, exists, copyFile, BaseDirectory, remove } from "@tauri-apps/plugin-fs";
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

export async function saveMapAsset(campaignId: string, sourceFilePath: string): Promise<string> {
  const mapsDirExists = await exists(`campaigns/${campaignId}/assets/maps`, {
    baseDir: BaseDirectory.AppData,
  });

  if (!mapsDirExists) {
    await mkdir(`campaigns/${campaignId}/assets/maps`, {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    });
  }

  const fileName =
    sourceFilePath.split(/[/\\]/).pop() || `map_${Date.now()}.png`;
  const relativeDestination = `campaigns/${campaignId}/assets/maps/${fileName}`;

  const alreadyExists = await exists(relativeDestination, {
    baseDir: BaseDirectory.AppData,
  });

  if (alreadyExists) {
    console.error(`Map "${fileName}" has already been imported.`);
    return relativeDestination
  }

  await copyFile(sourceFilePath, relativeDestination, {
    toPathBaseDir: BaseDirectory.AppData,
  });

  return relativeDestination;
}

export async function deleteMapAsset(mapPath: string): Promise<void> {
  await remove(mapPath, {
    baseDir: BaseDirectory.AppData,
    recursive: true,
  });
}

// Convert a relative path (e.g. "assets/maps/xxx.png") to an image src URL
export async function getAssetUrl(relativePath: string): Promise<string> {
  const appData = await appDataDir();

  // Clean leading slashes/backslashes to avoid path duplication
  const cleanRelativePath = relativePath.replace(/^[/\\]+/, "");
  const fullPath = await join(appData, cleanRelativePath);
  return convertFileSrc(fullPath);
}

// Copy selected token file into AppData/assets/tokens/ and return relative path
export async function saveTokenAsset(campaignId: string, sourceFilePath: string): Promise<string> {
  const tokensDirExists = await exists(`campaigns/${campaignId}/assets/tokens`, {
    baseDir: BaseDirectory.AppData,
  });

  if (!tokensDirExists) {
    await mkdir(`campaigns/${campaignId}/assets/tokens`, {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    });
  }

  const fileName =
    sourceFilePath.split(/[/\\]/).pop() || `token_${Date.now()}.png`;

  const relativeDestination = `campaigns/${campaignId}/assets/tokens/${fileName}`;

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
