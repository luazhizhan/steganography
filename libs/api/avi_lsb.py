import numpy as np
import hexdump
import textwrap
import cv2
import io
import math

def get_n_most_significant_bits(value, n):
    value = (value >> n) % 256
    return value << n

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
    return payload

def _encodeLSB(frame, payload, n):
    source = np.asarray(frame)
    (y, x, channel) = source.shape
    
    for c in range(channel):
        if (not payload):
            break
        
        for i in range(y):
            if (not payload):
                break
                    
            for j in range(x):
                if (not payload):
                    break
        
                source[i][j][c] = get_n_most_significant_bits(source[i][j][c], n) + int(payload.pop(0), 2)
    
    return source, payload

def extractLSB(frame, n, size):
    image = np.asarray(frame)
    (y, x, channel) = image.shape
    count = 0
    ans = ""

    for c in range(channel):
        if (count == size):
            break
        
        for i in range(y):
            if (count == size):
                break
                    
            for j in range(x):
                if (count == size):
                    break
                
                binary = (image[i][j][c] << 8 - n) % 256
                binary = bin(binary >> 8 - n)[2:].zfill(n)
                ans += binary
                count += 1
    
    return ans

def encode(path, payload, n):
    cap = cv2.VideoCapture(path)
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    fps = cap.get(cv2.CAP_PROP_FPS)
    

    fourcc = cv2.VideoWriter_fourcc(*'RGBA')
    tmp = io.BytesIO()
    out = cv2.VideoWriter("./tmp/output.avi", fourcc, fps, (int(width),int(height)))
    
    frame_number = -1
    payload = getPayloadBinList(payload, n)
    
    while(True):
        try:
            frame_number += 1
            ret, frame = cap.read()
            if frame_number == 1:  # if frame is the third frame than replace it with blank drame
                change_frame_with, payload = _encodeLSB(frame, payload, n)
                frame = change_frame_with
            
            out.write(frame)

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            cv2.imshow('frame',gray)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        except:
            pass
        finally:
            cap.release()
            out.release()

def decode(path, n, size):
    cap = cv2.VideoCapture(path )
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    limit = math.ceil(size*8/n);

    frame_number = -1
    ans = ""
    
    try:
        while(True):
            frame_number += 1
            ret, frame = cap.read()
            
            if frame_number == 1:  
                ans += extractLSB(frame, n, limit)
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            #cv2.imshow('frame',gray)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    except:
        pass
    finally:
        cap.release()
        
        ans = "".join(ans)
        spill = len(ans) % 8
        ans = ans[:len(ans)-spill]
        ans = textwrap.fill(ans, 8)
        ans = ans.split("\n")
        ans = [hex(int(i, 2))[2:].zfill(2) for i in ans]
        ans = "".join(ans)
        ans = hexdump.restore(ans)

        tmp = io.BytesIO()
        tmp.write(ans)
        tmp.seek(0)
        return tmp    




# # f = open("../../InputFiles/payload.txt", "rb")
# # payload = f.read()
# # f.close()

# # # encode("", payload, 4)

# # cap = cv2.VideoCapture("output.avi")
# # height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
# # width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)

# # frame_number = -1
# # while(True):
# #     frame_number += 1
# #     ret, frame = cap.read()
# #     if frame_number == 1:  
# #         print(frame[0][0][0], frame[0][1][0], frame[0][2][0])
    
# #     gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
# #     cv2.imshow('frame',gray)
# #     if cv2.waitKey(1) & 0xFF == ord('q'):
# #         break

# f = open("payloaddecode.txt", "wb")
# f.write(decode("", 4, 11).getvalue())
# f.close()