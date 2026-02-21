import ImageKit from '@imagekit/nodejs';

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
});

export function getImageKitAuth() {
  return imagekit.helper.getAuthenticationParameters();
}

export { imagekit };
