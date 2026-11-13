"""Konstanta dan path pipeline TABAT. Semua skrip dijalankan dari tabat-app/."""
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP_ROOT = HERE.parent
RISET = APP_ROOT.parent / 'Paket_Riset_Karhutla_Berulang'
AS_OF = '2027-06-01'
DEADLINE = '2027-08-01'
SEED = 2026

DB_PATH = APP_ROOT / 'app' / 'data' / 'tabat.db'
GEO_DIR = APP_ROOT / 'app' / 'public' / 'geo'
GADM2 = HERE / 'data_ext' / 'gadm41_IDN_2.json'

B3 = RISET / 'outputs' / 'bab3'
YEARS = list(range(2015, 2025))
ELNINO = [2015, 2019, 2023]
BLOCK = 5
KELAS_ORDER = ['P1', 'P2', 'CEK', 'PANTAU', 'LAIN']
FOKUS_PROV = ['KalimantanTengah', 'KalimantanSelatan']
