import os
import sys
from pathlib import Path

os.environ.pop("OPENAI_API_KEY", None)
sys.path.insert(0, str(Path(__file__).parents[1]))

