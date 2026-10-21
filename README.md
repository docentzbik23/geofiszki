# GeoFiszki — wersja 3

Aplikacja zawiera 1000 fiszek opartych na wyciągach z 21 aktów prawnych PDF, 378 pytań ABC oraz bibliotekę 25 oryginalnych PDF (21 aktów i 4 arkusze).

## Nauka
- **Szybkie fiszki:** pytanie → kliknięcie „Pokaż odpowiedź” → samoocena. Niczego nie trzeba wpisywać.
- **Testy ABC:** pytania z oryginalnych arkuszy. Klucz nie jest w pełni zweryfikowany.
- **Odpowiedź własna:** opcjonalne pole tekstowe i porównanie z odpowiedzią; bez automatycznej oceny.
- **Powtórki:** pytania oznaczone „Do powtórki”.
- **Biblioteka PDF:** wszystkie dokumenty z bezpośrednimi odnośnikami. Przy fiszkach wybranych ze źródeł dostępny jest odnośnik do strony PDF, jeżeli została zapisana.

## Ograniczenia
891 kart powstało automatycznie z fragmentów PDF. Zmieniono je na formę szybkiego odsłaniania odpowiedzi, ale ich merytoryczna redakcja nie została zakończona. Część może być nieprecyzyjna lub pozbawiona pełnego kontekstu. Odpowiedzi do arkuszy nie są w pełni zweryfikowane. Dokumenty PDF mogą zawierać starsze wersje aktów prawnych; nie wykonano kompletnej kontroli obowiązywania.

## Uruchomienie
1. Rozpakuj ZIP.
2. W folderze z `index.html` uruchom `python -m http.server 8000`.
3. Otwórz `http://localhost:8000`.

## Publikacja online
Prześlij **całą zawartość archiwum, wraz z folderem pdf**, do repozytorium GitHub. W Settings → Pages wybierz publikację z gałęzi `main` i katalogu `/ (root)`. Otwórz otrzymany adres HTTPS na telefonie i komputerze. Aplikacja nie jest jeszcze opublikowana.

Po pierwszym uruchomieniu podstawowa aplikacja działa offline; dokumenty PDF są pobierane i buforowane przy pierwszym otwarciu. Postępy zapisują się lokalnie i można je przenosić przez eksport/import.

W tej wersji nazwy PDF nie zawierają końcowych oznaczeń kopii (1), (2) itd. Odnośniki do PDF i identyfikatory źródeł zostały odpowiednio zaktualizowane.
