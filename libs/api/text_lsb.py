# $3CR3+

import io

from libs.api.bit_manipulation import str_to_bytes

DELIMITER = ['00100100', '00110011', '01000011',
             '01010010', '00110011', '00101011']


def convert_bit_to_byte(s):
    v = int(s, 2)
    b = bytearray()
    while v:
        b.append(v & 0xff)
        v >>= 8
    return bytes(b[::-1])


def encode(cover, payload, bits):

    # Converting the cover object bytes into bits
    coverobject_bit = "".join([format(n, '08b') for n in cover])
    coverobject_bitList = [coverobject_bit[idx:idx + 8]
                           for idx in range(0, len(coverobject_bit), 8)]   # Storing the bits into list

    # Converting the payload object byte into bits
    payload_bit = "".join([format(n, '08b') for n in str_to_bytes(payload)])

    payload_bitList = [payload_bit[idx:idx + int(bits)] for idx in range(
        0, len(payload_bit), int(bits))]   # Storing the bits into list

    difference_list = []
    # Pad 0 to the last item in the list to match the number of bits user choose
    if len(payload_bitList[-1]) != bits:
        difference = int(bits)-len(payload_bitList[-1])
        difference_list.append('{0:08b}'.format(difference+1))
        # -1 because if user choose 8, there will be no padding
        payload_bitList[-1] = '0'*(difference) + payload_bitList[-1]

    # Check if the coverobject is big enough to hide the payload
    if len(payload_bitList) > len(coverobject_bitList):
        raise ValueError("Cover object has to be bigger to hide the payload with " +
                         str(bits) + " bits replacement.")
    else:
        encoded_coverobjectList = []
        pos = 0
        for pos in range(len(payload_bitList)):
            # Encode the payload into the cover object
            encoded_coverobjectList.append(
                coverobject_bitList[pos][:8-int(bits)] + payload_bitList[pos])
        # Add delimiter into the object and convert list into string
        encoded_coverobjectList = difference_list + \
            encoded_coverobjectList + DELIMITER + coverobject_bitList[pos+1:]
        encoded_coverobjectString = ''.join(
            [str(elem) for elem in encoded_coverobjectList])

    tmp = io.BytesIO()
    tmp.write(convert_bit_to_byte(encoded_coverobjectString))
    tmp.seek(0)
    return tmp


def decode(cover, bits):

    # Converting the byte into bits
    hidden_payload_bit = "".join([format(n, '08b') for n in cover])
    # Get the bit of the delimiter
    delimiter_string = "".join([str(elem) for elem in DELIMITER])
    # Extract the cover object that is encoded with payload
    hidden_payload_bit = hidden_payload_bit.split(delimiter_string)[0]
    hidden_payload_bitList = [hidden_payload_bit[idx:idx + 8] for idx in range(
        0, len(hidden_payload_bit), 8)]  # Sort the payload into in item in list
    # Get the number of padded 0 previously
    num_padded = int(hidden_payload_bitList[0], 2)
    # Remove the secret padded int
    hidden_payload_bitList.remove(hidden_payload_bitList[0])

    # Extract the bit from the cover object
    for i in range(len(hidden_payload_bitList)):
        hidden_payload_bitList[i] = hidden_payload_bitList[i][8 -
                                                              int(bits):]

    # Remove the extra padding for the last item
    hidden_payload_bitList[-1] = hidden_payload_bitList[-1][num_padded-1:]
    # Join the list into a string
    hidden_payload_string = ''.join([str(elem)
                                    for elem in hidden_payload_bitList])

    tmp = io.BytesIO()
    tmp.write(convert_bit_to_byte(hidden_payload_string))
    tmp.seek(0)
    return tmp
