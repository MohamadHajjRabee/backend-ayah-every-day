# Ayah Every Day Backend

This is the backend server for the **Ayah Every Day** project. It provides a public API that returns a random ayah (verse) from the Quran every day. The server is built with **Node.js** and uses a **Postgres** database hosted on **Vercel**.

## Features

- Public API with a single GET route.
- Provides the ayah in Arabic and English.
- Returns the surah name in English, Arabic, and Roman transliteration.
- Automatically updates the ayah every day at 1 PM UTC.

## Tech Stack

- **Backend**: Node.js
- **Database**: Postgres (hosted on Vercel)

## API Endpoints

### `GET https://backend-ayah-every-day.vercel.app/ayah`

Returns the ayah of the day in JSON format. The response structure is as follows:

```json
{
  "id": 1,
  "surah_no": 1,
  "surah_name_en": "The Opener",
  "surah_name_ar": "الفاتحة",
  "surah_name_roman": "Al-Fatihah",
  "ayah_no_surah": 1,
  "ayah_ar": "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
  "ayah_en": "In the Name of Allah—the Most Compassionate, Most Merciful."
}
```

## Database

The main data is sourced from [this Kaggle dataset](https://www.kaggle.com/datasets/imrankhan197/the-quran-dataset).
The Deutsch Quran ayahs is sourced from [this kaggle dataset](https://www.kaggle.com/datasets/yasirabdaali/the-holy-quran-in-44-languages?select=german.aburida.sql)

## Usage

This API can be used for personal or commercial projects, provided that credit is given to **Ayah Every Day**.

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvements, feel free to open an issue or submit a pull request.
