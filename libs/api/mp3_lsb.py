import io
import math
import textwrap

import hexdump

# file = io.BytesIO(open("basemp3.mp3", "rb")) // read file as bytes into bytesIO stream
# data = hexdump.dump(file.getvalue()) //convert to usable format


def get_n_most_significant_bits(value, n):
    value = (value >> n) % 256
    return value << n


def encodeBits(cover: list, payload: list, n: int):
    for i in range(1, len(cover)):
        if (not payload):
            break

        cover[i] = textwrap.fill(cover[i], 2)
        cover[i] = cover[i].split("\n")

        for j in range(len(cover[i])):
            if (not payload):
                cover[i] = "".join(cover[i])
                break

            cover[i][j] = hex(get_n_most_significant_bits(
                int(cover[i][j], 16), n) + int(payload.pop(0), 2))[2:].zfill(2)

        cover[i] = "".join(cover[i])
    return cover


def getSourceHexDump(data):
    data = hexdump.dump(data)
    data = data.replace(" ", "")
    data = data.split(sep="FFFBE264")
    if (len(data) < 10):
        raise ValueError("File has an unsupported format, Ensure MP3 320kbps bitrate, 44100Hz, Joint Stereo On, Intensity Stereo On, Original copy of media. MP3 HEADER: FFFBE264")
    
    numFrames = len(data) - 1;
    freeBytes = numFrames * len(data[1])
    
    return freeBytes, data


def getPayloadBinList(payload, n: int):
    payload = hexdump.dump(payload)
    payload = payload.split(sep=" ")
    lengthInBits = len(payload) * 8
    for i in range(len(payload)):
        payload[i] = bin(int(payload[i], 16))[2:].zfill(8)
    payload = "".join(payload)
    payload = textwrap.fill(payload, n)
    payload = payload.split("\n")
    if (len(payload[-1]) != n):
        payload[-1] = payload[-1].ljust(n, "0")

    size = len(payload)
    return size, lengthInBits, payload


def encode(cover, payload, n):
    freeBytes, cover = getSourceHexDump(cover)
    size, len, payload = getPayloadBinList(payload, n)
    
    if (size > freeBytes):
        raise ValueError(
            "Input file too large to hide, "
            f"requires {size} free bytess, using {n}"
        )
    
    output = encodeBits(cover, payload, n)
    output = "FFFBE264".join(output)
    output = hexdump.restore(output)

    tmp = io.BytesIO()
    tmp.write(output)
    tmp.seek(0)
    return tmp


def decodeAndBuild(cover, n, size):
    data = hexdump.dump(cover)
    data = data.replace(" ", "")
    data = data.split(sep="FFFBE264")
    limit = math.ceil(size*8/n);

    ans = ""
    count = 0
    for i in range(1, len(data)):
        if (count == limit):
            break
        
        d = data[i]
        d= textwrap.fill(d, 2)
        d = d.split("\n")

        for j in d:
            if (count == limit):
                break
                
            binary = (int(j, 16) << 8 - n) % 256
            binary = bin(binary >> 8 - n)[2:].zfill(n)
            ans += binary
            count += 1

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
