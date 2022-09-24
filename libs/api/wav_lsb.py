import io
import logging
import math
import wave
from time import time

from libs.api.bit_manipulation import (lsb_deinterleave_bytes,
                                       lsb_interleave_bytes, str_to_bytes)

log = logging.getLogger(__name__)


def hide_data(input_file, message, num_lsb):
    """Hide message in the sound file"""

    input_file = wave.open(input_file, "r")
    params = input_file.getparams()
    num_channels = input_file.getnchannels()
    sample_width = input_file.getsampwidth()
    num_frames = input_file.getnframes()
    num_samples = num_frames * num_channels

    # We can hide up to num_lsb bits in each sample of the sound file
    max_bytes_to_hide = (num_samples * num_lsb) // 8
    data = str_to_bytes(message)

    log.debug(f"Using {num_lsb} LSBs, we can hide {max_bytes_to_hide} bytes")

    if len(data) > max_bytes_to_hide:
        required_lsb = math.ceil(len(data) * 8 / num_samples)
        raise ValueError(
            "Input file too large to hide, "
            f"requires {required_lsb} LSBs, using {num_lsb}"
        )

    if sample_width != 1 and sample_width != 2:
        # Python's wave module doesn't support higher sample widths
        raise ValueError("File has an unsupported bit-depth")

    start = time()
    sound_frames = input_file.readframes(num_frames)
    sound_frames = lsb_interleave_bytes(
        sound_frames, data, num_lsb, byte_depth=sample_width
    )
    log.debug(f"{len(data)} bytes hidden".ljust(
        30) + f" in {time() - start:.2f}s")

    temp_file = io.BytesIO()
    sound_steg = wave.open(temp_file, "wb")
    sound_steg.setparams(params)
    sound_steg.writeframes(sound_frames)
    sound_steg.close()
    temp_file.seek(0)
    return temp_file


def recover_data(input_file, num_lsb, bytes_to_recover):
    """Recover data from the file at sound_path to the file at output_path"""
    start = time()
    sound = wave.open(input_file, "r")

    # num_channels = sound.getnchannels()
    sample_width = sound.getsampwidth()
    num_frames = sound.getnframes()
    sound_frames = sound.readframes(num_frames)
    log.debug("Files read".ljust(30) + f" in {time() - start:.2f}s")

    if sample_width != 1 and sample_width != 2:
        # Python's wave module doesn't support higher sample widths
        raise ValueError("File has an unsupported bit-depth")

    start = time()
    data = lsb_deinterleave_bytes(
        sound_frames, 8 * bytes_to_recover, num_lsb, byte_depth=sample_width
    )
    log.debug(
        f"Recovered {bytes_to_recover} bytes".ljust(
            30) + f" in {time() - start:.2f}s"
    )

    return data
