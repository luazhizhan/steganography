import sys
import textwrap

from PIL import Image
import io
import hexdump
import os
import math
import pillow_jpls

os.system("")


def get_n_most_significant_bits(value, n):
    value = (value >> n) % 256
    return value << n


class style():
    RED = '\033[31m'
    GREEN = '\033[32m'


class Steganography:
    # coverJPG.jpg
    # payloadJPG.jpg
    BLACK_PIXEL = (0, 0, 0)

    def _int_to_bin(self, rgb):
        r, g, b = rgb
        return f'{r:08b}', f'{g:08b}', f'{b:08b}'

    def _bin_to_int(self, rgb):
        r, g, b = rgb
        return int(r, 2), int(g, 2), int(b, 2)

    def encode_rgb(self, rgb1, rgb2, bitLength):
        r1, g1, b1 = self._int_to_bin(rgb1)
        r2, g2, b2 = self._int_to_bin(rgb2)
        rgb = r1[:(8 - bitLength)] + r2[:bitLength], g1[:(8 - bitLength)] + g2[:bitLength], b1[:(8 - bitLength)] + b2[
                                                                                                                   :bitLength]
        return self._bin_to_int(rgb)

    def decode_rgb(self, rgb, rgb2, bitLength):
        r, g, b = self._int_to_bin(rgb)
        r2, g2, b2 = self._int_to_bin(rgb2)

        new_rgb = r[8 - bitLength:], g[8 - bitLength:], b[8 - bitLength]
        return self._bin_to_int(new_rgb)

    def encode(self, cover, payload, bitLength):
        """Merge image2 into image1.

        :param image1: First image
        :param image2: Second image
        :return: A new merged image.
        """
        payload = hexdump.dump(payload)

        payload = payload.split(sep=" ")
        lengthInBits = len(payload)*8
        
        #converts HEX into BIN
        for i in range(len(payload)):
            payload[i] = bin(int(payload[i], 16))[2:].zfill(8)
            
        payload = "".join(payload)
        payload = textwrap.fill(payload, bitLength)
        payload = payload.split("\n")
        
        if (len(payload[-1]) != bitLength):
            payload[-1] = payload[-1].ljust(bitLength, "0")
            
        pixelsToEdit = math.ceil(len(payload)/3)        
        # Get the pixel map of the two images
        
        height = cover.height
        width = cover.width
        pixel = cover.load()
        
        if (pixelsToEdit > height*width):
            raise ValueError(
            "Input file too large to hide"
        )
        
        for i in range(width):
            if (not payload):
                break 
            
            for j in range(height):
                if (not payload):
                    break
                
                (r,g,b) = pixel[i,j]
                #print("new", bin(r)[2:])
                
                if (payload):
                    r = get_n_most_significant_bits(r, bitLength) +  int(payload.pop(0), 2)
                    
                if (payload):
                    g = get_n_most_significant_bits(g, bitLength) +  int(payload.pop(0), 2)                   
                    
                if (payload):
                    b = get_n_most_significant_bits(b, bitLength) +  int(payload.pop(0), 2)
                
                pixel[i,j] = (r,g,b)
                
        return cover

    SUPPORTED = ['RGB', 'RGBA', 'L', 'CMYK']

    def _set_bits(self, bitLength):
        self.bitLength = int(bitLength)
        if not 0 <= self.bitLength <= 8:
            print('[!] Number of bitLength needs to be between 0-8.')
            sys.exit()

    def _get_image(self, path, itype):
        try:
            img = Image.open(path)
        except IOError as e:
            print('[!] {} image could not be opened.'.format(itype.title()))
            print('[!] {}'.format(e))
            sys.exit()

        if img.mode not in self.SUPPORTED:
            print('[!] Nonsupported image mode.')
            sys.exit()
        return img

    def decode(self, secretImage, bitLength, size):
        cover = secretImage.load()
        limit = math.ceil(size*8/bitLength);
        count = 0;
        height = secretImage.height
        width = secretImage.width
        ans = ""
        
        for i in range(width):
            if (count == limit):
                break
            
            for j in range(height):
                (r,g,b) = cover[i,j]
                
                if (count == limit):
                    break
                
                if (count != limit):
                    binary = (int(r) << 8 - bitLength) % 256
                    binary = bin(binary >> 8 - bitLength)[2:].zfill(bitLength)
                    ans += binary
                    count +=1
                    
                if (count != limit):
                    binary = (int(g) << 8 - bitLength) % 256
                    binary = bin(binary >> 8 - bitLength)[2:].zfill(bitLength)
                    ans += binary
                    count +=1
                
                if (count != limit):
                    binary = (int(b) << 8 - bitLength) % 256
                    binary = bin(binary >> 8 - bitLength)[2:].zfill(bitLength)
                    ans += binary
                    count +=1
            
        
        ans = "".join(ans)
        spill = len(ans) % 8
        ans = ans[:len(ans)-spill]
        ans = textwrap.fill(ans, 8)
        ans = ans.split("\n")
        ans = [hex(int(i, 2))[2:] for i in ans]
        ans = "".join(ans)
        ans = hexdump.restore(ans)  
        
        tmp = io.BytesIO()
        tmp.write(ans)
        tmp.seek(0)
        return tmp


def encodeInJpg(image, payload, n):
    #image in PIL.Image
    #payload in file
    s = Steganography()
    img = s.encode(image, payload, n)
    return img


def decodeFromJpg(image, n, size):
    #image in PIL.Image
    s = Steganography()
    ans = s.decode(image, n, size)
    return ans
    
