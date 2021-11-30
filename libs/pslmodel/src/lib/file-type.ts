import {multiByteIndexOf, stringToBytes, readUInt64LE, tarHeaderChecksumMatches, uint8ArrayUtf8ByteString} from './file-type-utils';
import { Buffer } from 'buffer';

export type FileType =
    | 'jpg' | 'png' | 'apng' | 'gif' | 'webp' | 'flif' | 'cr2' | 'orf' | 'arw' | 'dng'
    | 'nef' | 'rw2' | 'raf' | 'tif' | 'bmp' | 'jxr' | 'psd' | 'zip' | 'tar' | 'rar'
    | 'gz' | 'bz2' | '7z' | 'dmg' | 'mp4' | 'mid' | 'mkv' | 'webm' | 'mov' | 'avi'
    | 'wmv' | 'mpg' | 'mp2' | 'mp3' | 'm4a' | 'ogg' | 'opus' | 'flac' | 'wav' | 'qcp'
    | 'amr' | 'pdf' | 'epub' | 'mobi' | 'exe' | 'swf' | 'rtf' | 'woff' | 'woff2' | 'eot'
    | 'ttf' | 'otf' | 'ico' | 'flv' | 'ps' | 'xz' | 'sqlite' | 'nes' | 'crx' | 'xpi'
    | 'cab' | 'deb' | 'ar' | 'rpm' | 'Z' | 'lz' | 'msi' | 'mxf' | 'mts' | 'wasm'
    | 'blend' | 'bpg' | 'docx' | 'pptx' | 'xlsx' | '3gp' | '3g2' | 'jp2' | 'jpm' | 'jpx'
    | 'mj2' | 'aif' | 'odt' | 'ods' | 'odp' | 'xml' | 'heic' | 'cur' | 'ktx' | 'ape'
    | 'wv' | 'asf' | 'wma' | 'dcm' | 'mpc' | 'ics' | 'glb' | 'pcap' | 'dsf' | 'lnk'
    | 'voc' | 'ac3' | 'm4b' | 'm4p' | 'm4v' | 'f4a' | 'f4b' | 'f4p' | 'f4v' | 'mie'
    | 'ogv' | 'ogm' | 'oga' | 'spx' | 'ogx' | 'arrow' | 'shp' | 'doc' | 'xls' | 'ppt';

export type MimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'image/flif'
  | 'image/x-canon-cr2'
  | 'image/tiff'
  | 'image/bmp'
  | 'image/vnd.ms-photo'
  | 'image/vnd.adobe.photoshop'
  | 'application/epub+zip'
  | 'application/x-xpinstall'
  | 'application/vnd.oasis.opendocument.text'
  | 'application/vnd.oasis.opendocument.spreadsheet'
  | 'application/vnd.oasis.opendocument.presentation'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/zip'
  | 'application/x-tar'
  | 'application/x-rar-compressed'
  | 'application/gzip'
  | 'application/x-bzip2'
  | 'application/x-7z-compressed'
  | 'application/x-apple-diskimage'
  | 'video/mp4'
  | 'audio/midi'
  | 'video/x-matroska'
  | 'video/webm'
  | 'video/quicktime'         // nosonar typescript:S1192
  | 'video/vnd.avi'
  | 'audio/vnd.wave'
  | 'audio/qcelp'
  | 'audio/x-ms-wma'
  | 'video/x-ms-asf'
  | 'application/vnd.ms-asf'
  | 'video/mpeg'
  | 'video/3gpp'
  | 'audio/mpeg'              // nosonar typescript:S1192
  | 'audio/mp4'
  | 'audio/opus'
  | 'video/ogg'
  | 'audio/ogg'
  | 'application/ogg'
  | 'audio/x-flac'
  | 'audio/ape'
  | 'audio/wavpack'
  | 'audio/amr'
  | 'application/pdf'
  | 'application/x-msdownload'
  | 'application/x-shockwave-flash'
  | 'application/rtf'
  | 'application/wasm'
  | 'font/woff'
  | 'font/woff2'
  | 'application/vnd.ms-fontobject'
  | 'font/ttf'
  | 'font/otf'
  | 'image/x-icon'            // nosonar typescript:S1192
  | 'video/x-flv'
  | 'application/postscript'
  | 'application/x-xz'
  | 'application/x-sqlite3'
  | 'application/x-nintendo-nes-rom'
  | 'application/x-google-chrome-extension'
  | 'application/vnd.ms-cab-compressed'
  | 'application/x-deb'
  | 'application/x-unix-archive'
  | 'application/x-rpm'
  | 'application/x-compress'
  | 'application/x-lzip'
  | 'application/x-msi'       // nosonar typescript:S1192
  | 'application/x-mie'
  | 'application/x-apache-arrow'
  | 'application/mxf'
  | 'video/mp2t'
  | 'application/x-blender'
  | 'image/bpg'
  | 'image/jp2'
  | 'image/jpx'
  | 'image/jpm'
  | 'image/mj2'
  | 'audio/aiff'
  | 'application/xml'
  | 'application/x-mobipocket-ebook'
  | 'image/heif'
  | 'image/heif-sequence'
  | 'image/heic'
  | 'image/heic-sequence'
  | 'image/ktx'
  | 'application/dicom'
  | 'audio/x-musepack'      // nosonar typescript:S1192
  | 'text/calendar'
  | 'model/gltf-binary'
  | 'application/vnd.tcpdump.pcap'
  | 'audio/x-dsf'
  | 'audio/x-voc'
  | 'audio/vnd.dolby.dd-raw'
  | 'audio/x-m4a'
  | 'image/apng'
  | 'image/x-olympus-orf'
  | 'image/x-sony-arw'
  | 'image/x-adobe-dng'
  | 'image/x-nikon-nef'
  | 'image/x-panasonic-rw2'
  | 'image/x-fujifilm-raf'
  | 'video/x-m4v'
  | 'video/3gpp2'
  | 'application/x-esri-shape'
  | 'application/msword'
  | 'application/vnd.ms-excel'   // nosonar typescript:S1192
  | 'application/vnd.ms-powerpoint';

export interface FileTypeResult {
  ext: FileType;
  mime: MimeType;
}

export type ReadableStreamWithFileType = ReadableStream & {
  readonly fileType?: FileTypeResult;
};

const xpiZipFilename = stringToBytes('META-INF/mozilla.rsa');
const oxmlContentTypes = stringToBytes('[Content_Types].xml');
const oxmlRels = stringToBytes('_rels/.rels');

export const fileType = (input: any) => {  // nosonar typescript:S3776  troppo complesso per intervenire
  if (!(input instanceof Uint8Array || input instanceof ArrayBuffer || Buffer.isBuffer(input))) {
    // tslint:disable-next-line: max-line-length
    throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`Buffer\` or \`ArrayBuffer\`, got \`${typeof input}\``);
  }

  const buffer = input instanceof Uint8Array ? input : new Uint8Array(input);

  if (!(buffer && buffer.length > 1)) {
    return;
  }

  const check = (header, options: {mask?: number[], offset?: number} = {}) => {
    options = {
      offset: 0,
      ...options
    };

    for (let i = 0; i < header.length; i++) {
      // If a bitmask is set
      if (options.mask) {
        // If header doesn't equal `buf` with bits masked off
        // tslint:disable-next-line: no-bitwise
        if (header[i] !== (options.mask[i] & buffer[i + options.offset])) {
          return false;
        }
      } else if (header[i] !== buffer[i + options.offset]) {
        return false;
      }
    }

    return true;
  };

  const checkString = (header, options: {mask?: number[], offset?: number} = {}) => check(stringToBytes(header), options);

  if (check([0xFF, 0xD8, 0xFF])) {
    return {
      ext: 'jpg',
      mime: 'image/jpeg'
    };
  }

  if (check([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
    // APNG format (https://wiki.mozilla.org/APNG_Specification)
    // 1. Find the first IDAT (image data) chunk (49 44 41 54)
    // 2. Check if there is an "acTL" chunk before the IDAT one (61 63 54 4C)

    // Offset calculated as follows:
    // - 8 bytes: PNG signature
    // - 4 (length) + 4 (chunk type) + 13 (chunk data) + 4 (CRC): IHDR chunk
    const startIndex = 33;
    const firstImageDataChunkIndex = buffer.findIndex((el, i) => i >= startIndex
      && buffer[i] === 0x49
      && buffer[i + 1] === 0x44
      && buffer[i + 2] === 0x41
      && buffer[i + 3] === 0x54);
    const sliced = buffer.subarray(startIndex, firstImageDataChunkIndex);

    if (sliced.findIndex((el, i) => sliced[i] === 0x61
        && sliced[i + 1] === 0x63
        && sliced[i + 2] === 0x54
        && sliced[i + 3] === 0x4C) >= 0) {
      return {
        ext: 'apng',
        mime: 'image/apng'
      };
    }

    return {
      ext: 'png',
      mime: 'image/png'
    };
  }

  if (check([0x47, 0x49, 0x46])) {
    return {
      ext: 'gif',
      mime: 'image/gif'
    };
  }

  if (check([0x57, 0x45, 0x42, 0x50], {offset: 8})) {
    return {
      ext: 'webp',
      mime: 'image/webp'
    };
  }

  if (check([0x46, 0x4C, 0x49, 0x46])) {
    return {
      ext: 'flif',
      mime: 'image/flif'
    };
  }

  // `cr2`, `orf`, and `arw` need to be before `tif` check
  if (
    (check([0x49, 0x49, 0x2A, 0x0]) || check([0x4D, 0x4D, 0x0, 0x2A])) &&
    check([0x43, 0x52], {offset: 8})
  ) {
    return {
      ext: 'cr2',
      mime: 'image/x-canon-cr2'
    };
  }

  if (check([0x49, 0x49, 0x52, 0x4F, 0x08, 0x00, 0x00, 0x00, 0x18])) {
    return {
      ext: 'orf',
      mime: 'image/x-olympus-orf'
    };
  }

  if (
    check([0x49, 0x49, 0x2A, 0x00]) &&
    (check([0x10, 0xFB, 0x86, 0x01], {offset: 4}) || check([0x08, 0x00, 0x00, 0x00], {offset: 4})) &&
    // This pattern differentiates ARW from other TIFF-ish file types:
    check([0x00, 0xFE, 0x00, 0x04, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x03, 0x01], {offset: 9})
  ) {
    return {
      ext: 'arw',
      mime: 'image/x-sony-arw'
    };
  }

  if (
    check([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]) &&
    (check([0x2D, 0x00, 0xFE, 0x00], {offset: 8}) ||
    check([0x27, 0x00, 0xFE, 0x00], {offset: 8}))
  ) {
    return {
      ext: 'dng',
      mime: 'image/x-adobe-dng'
    };
  }

  if (
    check([0x49, 0x49, 0x2A, 0x00]) &&
    check([0x1C, 0x00, 0xFE, 0x00], {offset: 8})
  ) {
    return {
      ext: 'nef',
      mime: 'image/x-nikon-nef'
    };
  }

  if (check([0x49, 0x49, 0x55, 0x00, 0x18, 0x00, 0x00, 0x00, 0x88, 0xE7, 0x74, 0xD8])) {
    return {
      ext: 'rw2',
      mime: 'image/x-panasonic-rw2'
    };
  }

  // `raf` is here just to keep all the raw image detectors together.
  if (checkString('FUJIFILMCCD-RAW')) {
    return {
      ext: 'raf',
      mime: 'image/x-fujifilm-raf'
    };
  }

  if (
    check([0x49, 0x49, 0x2A, 0x0]) ||
    check([0x4D, 0x4D, 0x0, 0x2A])
  ) {
    return {
      ext: 'tif',
      mime: 'image/tiff'
    };
  }

  if (check([0x42, 0x4D])) {
    return {
      ext: 'bmp',
      mime: 'image/bmp'
    };
  }

  if (check([0x49, 0x49, 0xBC])) {
    return {
      ext: 'jxr',
      mime: 'image/vnd.ms-photo'
    };
  }

  if (check([0x38, 0x42, 0x50, 0x53])) {
    return {
      ext: 'psd',
      mime: 'image/vnd.adobe.photoshop'
    };
  }

  // Zip-based file formats
  // Need to be before the `zip` check
  const zipHeader = [0x50, 0x4B, 0x3, 0x4];
  if (check(zipHeader)) {
    if (
      check([0x6D, 0x69, 0x6D, 0x65, 0x74, 0x79, 0x70, 0x65, 0x61, 0x70, 0x70, 0x6C, 0x69, 0x63, 0x61, 0x74,
        0x69, 0x6F, 0x6E, 0x2F, 0x65, 0x70, 0x75, 0x62, 0x2B, 0x7A, 0x69, 0x70], {offset: 30})
    ) {
      return {
        ext: 'epub',
        mime: 'application/epub+zip'
      };
    }

    // Assumes signed `.xpi` from addons.mozilla.org
    if (check(xpiZipFilename, {offset: 30})) {
      return {
        ext: 'xpi',
        mime: 'application/x-xpinstall'
      };
    }

    if (checkString('mimetypeapplication/vnd.oasis.opendocument.text', {offset: 30})) {
      return {
        ext: 'odt',
        mime: 'application/vnd.oasis.opendocument.text'
      };
    }

    if (checkString('mimetypeapplication/vnd.oasis.opendocument.spreadsheet', {offset: 30})) {
      return {
        ext: 'ods',
        mime: 'application/vnd.oasis.opendocument.spreadsheet'
      };
    }

    if (checkString('mimetypeapplication/vnd.oasis.opendocument.presentation', {offset: 30})) {
      return {
        ext: 'odp',
        mime: 'application/vnd.oasis.opendocument.presentation'
      };
    }

    // The docx, xlsx and pptx file types extend the Office Open XML file format:
    // https://en.wikipedia.org/wiki/Office_Open_XML_file_formats
    // We look for:
    // - one entry named '[Content_Types].xml' or '_rels/.rels',
    // - one entry indicating specific type of file.
    // MS Office, OpenOffice and LibreOffice may put the parts in different order, so the check should not rely on it.
    let zipHeaderIndex = 0; // The first zip header was already found at index 0
    let oxmlFound = false;
    let type;

    do {
      const offset = zipHeaderIndex + 30;

      if (!oxmlFound) {
        oxmlFound = (check(oxmlContentTypes, {offset}) || check(oxmlRels, {offset}));
      }

      if (!type) {
        if (checkString('word/', {offset})) {
          type = {
            ext: 'docx',
            mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          };
        } else if (checkString('ppt/', {offset})) {
          type = {
            ext: 'pptx',
            mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          };
        } else if (checkString('xl/', {offset})) {
          type = {
            ext: 'xlsx',
            mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          };
        }
      }

      if (oxmlFound && type) {
        return type;
      }

      zipHeaderIndex = multiByteIndexOf(buffer, zipHeader, offset);
    } while (zipHeaderIndex >= 0);

    // No more zip parts available in the buffer, but maybe we are almost certain about the type?
    if (type) {
      return type;
    }
  }

  if (
    check([0x50, 0x4B]) &&
    (buffer[2] === 0x3 || buffer[2] === 0x5 || buffer[2] === 0x7) &&
    (buffer[3] === 0x4 || buffer[3] === 0x6 || buffer[3] === 0x8)
  ) {
    return {
      ext: 'zip',
      mime: 'application/zip'
    };
  }

  if (
    check([0x30, 0x30, 0x30, 0x30, 0x30, 0x30], {offset: 148, mask: [0xF8, 0xF8, 0xF8, 0xF8, 0xF8, 0xF8]}) && // Valid tar checksum
    tarHeaderChecksumMatches(buffer)
  ) {
    return {
      ext: 'tar',
      mime: 'application/x-tar'
    };
  }

  if (
    check([0x52, 0x61, 0x72, 0x21, 0x1A, 0x7]) &&
    (buffer[6] === 0x0 || buffer[6] === 0x1)
  ) {
    return {
      ext: 'rar',
      mime: 'application/x-rar-compressed'
    };
  }

  if (check([0x1F, 0x8B, 0x8])) {
    return {
      ext: 'gz',
      mime: 'application/gzip'
    };
  }

  if (check([0x42, 0x5A, 0x68])) {
    return {
      ext: 'bz2',
      mime: 'application/x-bzip2'
    };
  }

  if (check([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C])) {
    return {
      ext: '7z',
      mime: 'application/x-7z-compressed'
    };
  }

  if (check([0x78, 0x01])) {
    return {
      ext: 'dmg',
      mime: 'application/x-apple-diskimage'
    };
  }

  // `mov` format variants
  if (
    check([0x66, 0x72, 0x65, 0x65], {offset: 4}) || // `free`
    check([0x6D, 0x64, 0x61, 0x74], {offset: 4}) || // `mdat` MJPEG
    check([0x6D, 0x6F, 0x6F, 0x76], {offset: 4}) || // `moov`
    check([0x77, 0x69, 0x64, 0x65], {offset: 4}) // `wide`
  ) {
    return {
      ext: 'mov',
      mime: 'video/quicktime'     // nosonar typescript:S1192
    };
  }

  // File Type Box (https://en.wikipedia.org/wiki/ISO_base_media_file_format)
  // It's not required to be first, but it's recommended to be. Almost all ISO base media files start with `ftyp` box.
  // `ftyp` box must contain a brand major identifier, which must consist of ISO 8859-1 printable characters.
  // Here we check for 8859-1 printable characters (for simplicity, it's a mask which also catches one non-printable character).
  if (
    check([0x66, 0x74, 0x79, 0x70], {offset: 4}) && // `ftyp`
    // tslint:disable-next-line: no-bitwise
    (buffer[8] & 0x60) !== 0x00 && (buffer[9] & 0x60) !== 0x00 && (buffer[10] & 0x60) !== 0x00 && (buffer[11] & 0x60) !== 0x00
  ) {
    // They all can have MIME `video/mp4` except `application/mp4` special-case which is hard to detect.
    // For some cases, we're specific, everything else falls to `video/mp4` with `mp4` extension.
    const brandMajor = uint8ArrayUtf8ByteString(buffer, 8, 12);
    switch (brandMajor) {
      case 'mif1':
        return {ext: 'heic', mime: 'image/heif'};
      case 'msf1':
        return {ext: 'heic', mime: 'image/heif-sequence'};
      case 'heic': case 'heix':
        return {ext: 'heic', mime: 'image/heic'};
      case 'hevc': case 'hevx':
        return {ext: 'heic', mime: 'image/heic-sequence'};
      case 'qt  ':
        return {ext: 'mov', mime: 'video/quicktime'};    // nosonar typescript:S1192
      case 'M4V ': case 'M4VH': case 'M4VP':
        return {ext: 'm4v', mime: 'video/x-m4v'};
      case 'M4P ':
        return {ext: 'm4p', mime: 'video/mp4'};
      case 'M4B ':
        return {ext: 'm4b', mime: 'audio/mp4'};
      case 'M4A ':
        return {ext: 'm4a', mime: 'audio/x-m4a'};
      case 'F4V ':
        return {ext: 'f4v', mime: 'video/mp4'};
      case 'F4P ':
        return {ext: 'f4p', mime: 'video/mp4'};
      case 'F4A ':
        return {ext: 'f4a', mime: 'audio/mp4'};
      case 'F4B ':
        return {ext: 'f4b', mime: 'audio/mp4'};
      default:
        if (brandMajor.startsWith('3g')) {
          if (brandMajor.startsWith('3g2')) {
            return {ext: '3g2', mime: 'video/3gpp2'};
          }

          return {ext: '3gp', mime: 'video/3gpp'};
        }

        return {ext: 'mp4', mime: 'video/mp4'};
    }
  }

  if (check([0x4D, 0x54, 0x68, 0x64])) {
    return {
      ext: 'mid',
      mime: 'audio/midi'
    };
  }

  // https://github.com/threatstack/libmagic/blob/master/magic/Magdir/matroska
  if (check([0x1A, 0x45, 0xDF, 0xA3])) {
    const sliced = buffer.subarray(4, 4 + 4096);
    const idPos = sliced.findIndex((el, i, arr) => arr[i] === 0x42 && arr[i + 1] === 0x82);

    if (idPos !== -1) {
      const docTypePos = idPos + 3;
      const findDocType = type => [...type].every((c, i) => sliced[docTypePos + i] === c.charCodeAt(0));

      if (findDocType('matroska')) {
        return {
          ext: 'mkv',
          mime: 'video/x-matroska'
        };
      }

      if (findDocType('webm')) {
        return {
          ext: 'webm',
          mime: 'video/webm'
        };
      }
    }
  }

  // RIFF file format which might be AVI, WAV, QCP, etc
  if (check([0x52, 0x49, 0x46, 0x46])) {
    if (check([0x41, 0x56, 0x49], {offset: 8})) {
      return {
        ext: 'avi',
        mime: 'video/vnd.avi'
      };
    }

    if (check([0x57, 0x41, 0x56, 0x45], {offset: 8})) {
      return {
        ext: 'wav',
        mime: 'audio/vnd.wave'
      };
    }

    // QLCM, QCP file
    if (check([0x51, 0x4C, 0x43, 0x4D], {offset: 8})) {
      return {
        ext: 'qcp',
        mime: 'audio/qcelp'
      };
    }
  }

  // ASF_Header_Object first 80 bytes
  if (check([0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11, 0xA6, 0xD9])) {
    // Search for header should be in first 1KB of file.

    let offset = 30;
    do {
      const objectSize = readUInt64LE(buffer, offset + 16);
      if (check([0x91, 0x07, 0xDC, 0xB7, 0xB7, 0xA9, 0xCF, 0x11, 0x8E, 0xE6, 0x00, 0xC0, 0x0C, 0x20, 0x53, 0x65], {offset})) {
        // Sync on Stream-Properties-Object (B7DC0791-A9B7-11CF-8EE6-00C00C205365)
        // tslint:disable-next-line: max-line-length
        if (check([0x40, 0x9E, 0x69, 0xF8, 0x4D, 0x5B, 0xCF, 0x11, 0xA8, 0xFD, 0x00, 0x80, 0x5F, 0x5C, 0x44, 0x2B], {offset: offset + 24})) {
          // Found audio:
          return {
            ext: 'wma',
            mime: 'audio/x-ms-wma'
          };
        }

        // tslint:disable-next-line: max-line-length
        if (check([0xC0, 0xEF, 0x19, 0xBC, 0x4D, 0x5B, 0xCF, 0x11, 0xA8, 0xFD, 0x00, 0x80, 0x5F, 0x5C, 0x44, 0x2B], {offset: offset + 24})) {
          // Found video:
          return {
            ext: 'wmv',
            mime: 'video/x-ms-asf'
          };
        }

        break;
      }

      offset += objectSize;
    } while (offset + 24 <= buffer.length);

    // Default to ASF generic extension
    return {
      ext: 'asf',
      mime: 'application/vnd.ms-asf'
    };
  }

  if (
    check([0x0, 0x0, 0x1, 0xBA]) ||
    check([0x0, 0x0, 0x1, 0xB3])
  ) {
    return {
      ext: 'mpg',
      mime: 'video/mpeg'
    };
  }

  // Check for MPEG header at different starting offsets
  for (let start = 0; start < 2 && start < (buffer.length - 16); start++) {
    if (
      check([0x49, 0x44, 0x33], {offset: start}) || // ID3 header
      check([0xFF, 0xE2], {offset: start, mask: [0xFF, 0xE6]}) // MPEG 1 or 2 Layer 3 header
    ) {
      return {
        ext: 'mp3',
        mime: 'audio/mpeg'    // nosonar typescript:S1192
      };
    }

    if (
      check([0xFF, 0xE4], {offset: start, mask: [0xFF, 0xE6]}) // MPEG 1 or 2 Layer 2 header
    ) {
      return {
        ext: 'mp2',
        mime: 'audio/mpeg'    // nosonar typescript:S1192
      };
    }

    if (
      check([0xFF, 0xF8], {offset: start, mask: [0xFF, 0xFC]}) // MPEG 2 layer 0 using ADTS
    ) {
      return {
        ext: 'mp2',
        mime: 'audio/mpeg'    // nosonar typescript:S1192
      };
    }

    if (
      check([0xFF, 0xF0], {offset: start, mask: [0xFF, 0xFC]}) // MPEG 4 layer 0 using ADTS
    ) {
      return {
        ext: 'mp4',
        mime: 'audio/mpeg'    // nosonar typescript:S1192
      };
    }
  }

  // Needs to be before `ogg` check
  if (check([0x4F, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64], {offset: 28})) {
    return {
      ext: 'opus',
      mime: 'audio/opus'
    };
  }

  // If 'OggS' in first  bytes, then OGG container
  if (check([0x4F, 0x67, 0x67, 0x53])) {
    // This is a OGG container

    // If ' theora' in header.
    if (check([0x80, 0x74, 0x68, 0x65, 0x6F, 0x72, 0x61], {offset: 28})) {
      return {
        ext: 'ogv',
        mime: 'video/ogg'
      };
    }

    // If '\x01video' in header.
    if (check([0x01, 0x76, 0x69, 0x64, 0x65, 0x6F, 0x00], {offset: 28})) {
      return {
        ext: 'ogm',
        mime: 'video/ogg'
      };
    }

    // If ' FLAC' in header  https://xiph.org/flac/faq.html
    if (check([0x7F, 0x46, 0x4C, 0x41, 0x43], {offset: 28})) {
      return {
        ext: 'oga',
        mime: 'audio/ogg'
      };
    }

    // 'Speex  ' in header https://en.wikipedia.org/wiki/Speex
    if (check([0x53, 0x70, 0x65, 0x65, 0x78, 0x20, 0x20], {offset: 28})) {
      return {
        ext: 'spx',
        mime: 'audio/ogg'
      };
    }

    // If '\x01vorbis' in header
    if (check([0x01, 0x76, 0x6F, 0x72, 0x62, 0x69, 0x73], {offset: 28})) {
      return {
        ext: 'ogg',
        mime: 'audio/ogg'
      };
    }

    // Default OGG container https://www.iana.org/assignments/media-types/application/ogg
    return {
      ext: 'ogx',
      mime: 'application/ogg'
    };
  }

  if (check([0x66, 0x4C, 0x61, 0x43])) {
    return {
      ext: 'flac',
      mime: 'audio/x-flac'
    };
  }

  if (check([0x4D, 0x41, 0x43, 0x20])) { // 'MAC '
    return {
      ext: 'ape',
      mime: 'audio/ape'
    };
  }

  if (check([0x77, 0x76, 0x70, 0x6B])) { // 'wvpk'
    return {
      ext: 'wv',
      mime: 'audio/wavpack'
    };
  }

  if (check([0x23, 0x21, 0x41, 0x4D, 0x52, 0x0A])) {
    return {
      ext: 'amr',
      mime: 'audio/amr'
    };
  }

  if (check([0x25, 0x50, 0x44, 0x46])) {
    return {
      ext: 'pdf',
      mime: 'application/pdf'
    };
  }

  if (check([0x4D, 0x5A])) {
    return {
      ext: 'exe',
      mime: 'application/x-msdownload'
    };
  }

  if (
    (buffer[0] === 0x43 || buffer[0] === 0x46) &&
    check([0x57, 0x53], {offset: 1})
  ) {
    return {
      ext: 'swf',
      mime: 'application/x-shockwave-flash'
    };
  }

  if (check([0x7B, 0x5C, 0x72, 0x74, 0x66])) {
    return {
      ext: 'rtf',
      mime: 'application/rtf'
    };
  }

  if (check([0x00, 0x61, 0x73, 0x6D])) {
    return {
      ext: 'wasm',
      mime: 'application/wasm'
    };
  }

  if (
    check([0x77, 0x4F, 0x46, 0x46]) &&
    (
      check([0x00, 0x01, 0x00, 0x00], {offset: 4}) ||
      check([0x4F, 0x54, 0x54, 0x4F], {offset: 4})
    )
  ) {
    return {
      ext: 'woff',
      mime: 'font/woff'
    };
  }

  if (
    check([0x77, 0x4F, 0x46, 0x32]) &&
    (
      check([0x00, 0x01, 0x00, 0x00], {offset: 4}) ||
      check([0x4F, 0x54, 0x54, 0x4F], {offset: 4})
    )
  ) {
    return {
      ext: 'woff2',
      mime: 'font/woff2'
    };
  }

  if (
    check([0x4C, 0x50], {offset: 34}) &&
    (
      check([0x00, 0x00, 0x01], {offset: 8}) ||
      check([0x01, 0x00, 0x02], {offset: 8}) ||
      check([0x02, 0x00, 0x02], {offset: 8})
    )
  ) {
    return {
      ext: 'eot',
      mime: 'application/vnd.ms-fontobject'
    };
  }

  if (check([0x00, 0x01, 0x00, 0x00, 0x00])) {
    return {
      ext: 'ttf',
      mime: 'font/ttf'
    };
  }

  if (check([0x4F, 0x54, 0x54, 0x4F, 0x00])) {
    return {
      ext: 'otf',
      mime: 'font/otf'
    };
  }

  if (check([0x00, 0x00, 0x01, 0x00])) {
    return {
      ext: 'ico',
      mime: 'image/x-icon'      // nosonar typescript:S1192
    };
  }

  if (check([0x00, 0x00, 0x02, 0x00])) {
    return {
      ext: 'cur',
      mime: 'image/x-icon'      // nosonar typescript:S1192
    };
  }

  if (check([0x46, 0x4C, 0x56, 0x01])) {
    return {
      ext: 'flv',
      mime: 'video/x-flv'
    };
  }

  if (check([0x25, 0x21])) {
    return {
      ext: 'ps',
      mime: 'application/postscript'
    };
  }

  if (check([0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00])) {
    return {
      ext: 'xz',
      mime: 'application/x-xz'
    };
  }

  if (check([0x53, 0x51, 0x4C, 0x69])) {
    return {
      ext: 'sqlite',
      mime: 'application/x-sqlite3'
    };
  }

  if (check([0x4E, 0x45, 0x53, 0x1A])) {
    return {
      ext: 'nes',
      mime: 'application/x-nintendo-nes-rom'
    };
  }

  if (check([0x43, 0x72, 0x32, 0x34])) {
    return {
      ext: 'crx',
      mime: 'application/x-google-chrome-extension'
    };
  }

  if (
    check([0x4D, 0x53, 0x43, 0x46]) ||
    check([0x49, 0x53, 0x63, 0x28])
  ) {
    return {
      ext: 'cab',
      mime: 'application/vnd.ms-cab-compressed'
    };
  }

  // Needs to be before `ar` check
  // tslint:disable-next-line: max-line-length
  if (check([0x21, 0x3C, 0x61, 0x72, 0x63, 0x68, 0x3E, 0x0A, 0x64, 0x65, 0x62, 0x69, 0x61, 0x6E, 0x2D, 0x62, 0x69, 0x6E, 0x61, 0x72, 0x79])) {
    return {
      ext: 'deb',
      mime: 'application/x-deb'
    };
  }

  if (check([0x21, 0x3C, 0x61, 0x72, 0x63, 0x68, 0x3E])) {
    return {
      ext: 'ar',
      mime: 'application/x-unix-archive'
    };
  }

  if (check([0xED, 0xAB, 0xEE, 0xDB])) {
    return {
      ext: 'rpm',
      mime: 'application/x-rpm'
    };
  }

  if (
    check([0x1F, 0xA0]) ||
    check([0x1F, 0x9D])
  ) {
    return {
      ext: 'Z',
      mime: 'application/x-compress'
    };
  }

  if (check([0x4C, 0x5A, 0x49, 0x50])) {
    return {
      ext: 'lz',
      mime: 'application/x-lzip'
    };
  }

  if (check([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])) {
    // Use CLSIDs to check old Microsoft Office file types: .doc, .xls, .ppt
    // Ref: http://fileformats.archiveteam.org/wiki/Microsoft_Compound_File
    // tslint:disable-next-line: no-bitwise
    const sectorSize = 1 << buffer[30];
    let index = (buffer[49] * 256) + buffer[48];
    index = ((index + 1) * sectorSize) + 80;

    // If the CLSID block is located outside the buffer, it will return an extra field `minimumRequiredBytes`.
    // Therefore, user can optionally retry it with a larger buffer.
    if (index + 16 > buffer.length) {
      return {
        ext: 'msi',
        mime: 'application/x-msi',    // nosonar typescript:S1192
        minimumRequiredBytes: index + 16
      };
    }

    // If the CLSID block is located within the buffer, it will try to identify its file type (.doc, .xls, .ppt) by CLSID.
    if (check([0x06, 0x09, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46], {offset: index})) {
      return {
        ext: 'doc',
        mime: 'application/msword'
      };
    }

    if (check([0x10, 0x08, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46], {offset: index})) {
      return {
        ext: 'xls',
        mime: 'application/vnd.ms-excel'  // nosonar typescript:S1192
      };
    }

    if (check([0x20, 0x08, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46], {offset: index})) {
      return {
        ext: 'xls',
        mime: 'application/vnd.ms-excel'  // nosonar typescript:S1192
      };
    }

    if (check([0x10, 0x8D, 0x81, 0x64, 0x9B, 0x4F, 0xCF, 0x11, 0x86, 0xEA, 0x00, 0xAA, 0x00, 0xB9, 0x29, 0xE8], {offset: index})) {
      return {
        ext: 'ppt',
        mime: 'application/vnd.ms-powerpoint'
      };
    }
  }

  // tslint:disable-next-line: max-line-length
  if (check([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3E])) {
    return {
      ext: 'msi',
      mime: 'application/x-msi'     // nosonar typescript:S1192
    };
  }

  if (check([0x06, 0x0E, 0x2B, 0x34, 0x02, 0x05, 0x01, 0x01, 0x0D, 0x01, 0x02, 0x01, 0x01, 0x02])) {
    return {
      ext: 'mxf',
      mime: 'application/mxf'
    };
  }

  if (check([0x47], {offset: 4}) && (check([0x47], {offset: 192}) || check([0x47], {offset: 196}))) {
    return {
      ext: 'mts',
      mime: 'video/mp2t'
    };
  }

  if (check([0x42, 0x4C, 0x45, 0x4E, 0x44, 0x45, 0x52])) {
    return {
      ext: 'blend',
      mime: 'application/x-blender'
    };
  }

  if (check([0x42, 0x50, 0x47, 0xFB])) {
    return {
      ext: 'bpg',
      mime: 'image/bpg'
    };
  }

  if (check([0x00, 0x00, 0x00, 0x0C, 0x6A, 0x50, 0x20, 0x20, 0x0D, 0x0A, 0x87, 0x0A])) {
    // JPEG-2000 family

    if (check([0x6A, 0x70, 0x32, 0x20], {offset: 20})) {
      return {
        ext: 'jp2',
        mime: 'image/jp2'
      };
    }

    if (check([0x6A, 0x70, 0x78, 0x20], {offset: 20})) {
      return {
        ext: 'jpx',
        mime: 'image/jpx'
      };
    }

    if (check([0x6A, 0x70, 0x6D, 0x20], {offset: 20})) {
      return {
        ext: 'jpm',
        mime: 'image/jpm'
      };
    }

    if (check([0x6D, 0x6A, 0x70, 0x32], {offset: 20})) {
      return {
        ext: 'mj2',
        mime: 'image/mj2'
      };
    }
  }

  if (check([0x46, 0x4F, 0x52, 0x4D])) {
    return {
      ext: 'aif',
      mime: 'audio/aiff'
    };
  }

  if (checkString('<?xml ')) {
    return {
      ext: 'xml',
      mime: 'application/xml'
    };
  }

  if (check([0x42, 0x4F, 0x4F, 0x4B, 0x4D, 0x4F, 0x42, 0x49], {offset: 60})) {
    return {
      ext: 'mobi',
      mime: 'application/x-mobipocket-ebook'
    };
  }

  if (check([0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A])) {
    return {
      ext: 'ktx',
      mime: 'image/ktx'
    };
  }

  if (check([0x44, 0x49, 0x43, 0x4D], {offset: 128})) {
    return {
      ext: 'dcm',
      mime: 'application/dicom'
    };
  }

  // Musepack, SV7
  if (check([0x4D, 0x50, 0x2B])) {
    return {
      ext: 'mpc',
      mime: 'audio/x-musepack'    // nosonar typescript:S1192
    };
  }

  // Musepack, SV8
  if (check([0x4D, 0x50, 0x43, 0x4B])) {
    return {
      ext: 'mpc',
      mime: 'audio/x-musepack'    // nosonar typescript:S1192
    };
  }

  if (check([0x42, 0x45, 0x47, 0x49, 0x4E, 0x3A])) {
    return {
      ext: 'ics',
      mime: 'text/calendar'
    };
  }

  if (check([0x67, 0x6C, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00])) {
    return {
      ext: 'glb',
      mime: 'model/gltf-binary'
    };
  }

  if (check([0xD4, 0xC3, 0xB2, 0xA1]) || check([0xA1, 0xB2, 0xC3, 0xD4])) {
    return {
      ext: 'pcap',
      mime: 'application/vnd.tcpdump.pcap'
    };
  }

  // Sony DSD Stream File (DSF)
  if (check([0x44, 0x53, 0x44, 0x20])) {
    return {
      ext: 'dsf',
      mime: 'audio/x-dsf' // Non-standard
    };
  }

  if (check([0x4C, 0x00, 0x00, 0x00, 0x01, 0x14, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46])) {
    return {
      ext: 'lnk',
      mime: 'application/x.ms.shortcut' // Invented by us
    };
  }

  if (checkString('Creative Voice File')) {
    return {
      ext: 'voc',
      mime: 'audio/x-voc'
    };
  }

  if (check([0x0B, 0x77])) {
    return {
      ext: 'ac3',
      mime: 'audio/vnd.dolby.dd-raw'
    };
  }

  if ((check([0x7E, 0x10, 0x04]) || check([0x7E, 0x18, 0x04])) && check([0x30, 0x4D, 0x49, 0x45], {offset: 4})) {
    return {
      ext: 'mie',
      mime: 'application/x-mie'
    };
  }

  if (check([0x41, 0x52, 0x52, 0x4F, 0x57, 0x31, 0x00, 0x00])) {
    return {
      ext: 'arrow',
      mime: 'application/x-apache-arrow'
    };
  }

  if (check([0x27, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], {offset: 2})) {
    return {
      ext: 'shp',
      mime: 'application/x-esri-shape'
    };
  }
};
