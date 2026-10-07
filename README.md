# Вычислитель отличий (JS)

[![hexlet-check](https://github.com/TiltStable/frontend-project-46/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/TiltStable/frontend-project-46/actions)
[![Node CI](https://github.com/TiltStable/frontend-project-46/actions/workflows/node-ci.yml/badge.svg)](https://github.com/TiltStable/frontend-project-46/actions/workflows/node-ci.yml)

Узнаете, как создавать cli приложения, парсить и форматировать данные в json, yaml. Научитесь проектировать архитектуру приложений. А также писать unit-тесты.

Учебный проект Хекслета: https://ru.hexlet.io/programs/frontend
Как это должно работать: https://asciinema.org/a/Pe6QypnLEmFWssNAjCOJN1iii

## Стек

- JavaScript (Node.js >= 22)
- [commander.js](https://github.com/tj/commander.js) — построение CLI
- [Vitest](https://vitest.dev/) — тесты

## Установка

```bash
git clone https://github.com/TiltStable/frontend-project-46.git
cd frontend-project-46
make install        # = npm ci
npm link            # делает команду gendiff глобальной
```

## Использование

Справка по утилите:

```bash
gendiff -h
```

```
Usage: gendiff [options] <filepath1> <filepath2>

Compares two configuration files and shows a difference.

Options:
  -V, --version        output the version number
  -f, --format [type]  output format (default: "stylish")
  -h, --help           display help for command
```

Версия утилиты:

```bash
gendiff -V
```

Сравнение двух конфигурационных файлов (выбор формата — как в eslint).
Поддерживаются входные данные JSON и YAML, в том числе вложенные структуры.
Три формата вывода: stylish (дерево с отступами, по умолчанию), plain
(текстовые описания) и json (машиночитаемый массив изменений). Запуск из
корня репозитория:

```bash
gendiff file1.json file2.json
```

```
{
    common: {
      + follow: false
        setting1: Value 1
      - setting2: 200
      - setting3: true
      + setting3: null
      + setting4: blah blah
      + setting5: {
            key5: value5
        }
        setting6: {
            doge: {
              - wow: 
              + wow: so much
            }
            key: value
          + ops: vops
        }
    }
    group1: {
      - baz: bas
      + baz: bars
        foo: bar
      - nest: {
            key: value
        }
      + nest: str
    }
  - group2: {
        abc: 12345
        deep: {
            id: 45
        }
    }
  + group3: {
        deep: {
            id: {
                number: 45
            }
        }
        fee: 100500
    }
}
```

Строка без знака — ключ есть в обоих файлах и значения равны; `-` — ключ/значение
только из первого файла; `+` — только из второго. Ключи выводятся в алфавитном
порядке. Пути работают как относительные (от текущей директории), так и
абсолютные. Каждый уровень вложенности добавляет 4 пробела отступа.

То же самое с плоскими YAML-файлами (`.yml` и `.yaml`):

```bash
gendiff file1.yml file2.yml
```

```
{
  - follow: false
    host: hexlet.io
  - proxy: 123.234.53.22
  - timeout: 50
  + timeout: 20
  + verbose: true
}
```

Демо сравнения YAML: https://asciinema.org/a/UbzYKLfT0tToew72

Демо работы: https://asciinema.org/a/DpWq0e1LfM9jGzHU

Формат plain описывает изменения текстом (путь до свойства от корня):

```bash
gendiff --format plain file1.json file2.json
```

```
Property 'common.follow' was added with value: false
Property 'common.setting2' was removed
Property 'common.setting3' was updated. From true to null
Property 'common.setting4' was added with value: 'blah blah'
Property 'common.setting5' was added with value: [complex value]
Property 'common.setting6.doge.wow' was updated. From '' to 'so much'
Property 'common.setting6.ops' was added with value: 'vops'
Property 'group1.baz' was updated. From 'bas' to 'bars'
Property 'group1.nest' was updated. From [complex value] to 'str'
Property 'group2' was removed
Property 'group3' was added with value: [complex value]
```

Строки выводятся в одинарных кавычках, числа и `true`/`false`/`null` — как
есть; составные значения заменяются на `[complex value]`.

Демо plain-формата: https://asciinema.org/a/7KhquTVyrlYHbUrY

Формат json печатает машиночитаемый массив изменений (по образцу json-вывода
ESLint): каждая запись — `{ type, key, value }` или `{ type, key, oldValue,
newValue }`, значения — настоящие JSON-структуры:

```bash
gendiff --format json file1.json file2.json
```

```json
[
  {
    "type": "added",
    "key": "common.follow",
    "value": false
  },
  {
    "type": "removed",
    "key": "common.setting2",
    "value": 200
  },
  {
    "type": "changed",
    "key": "common.setting3",
    "oldValue": true,
    "newValue": null
  }
]
```

Всего для демо-файлов выводится 11 записей; составные значения (вложенные
объекты и массивы) сериализуются как есть, без сокращений. Неизменённые
свойства в вывод не попадают (только дельта); ключи, содержащие точку,
неотличимы в пути от вложенности — учитывайте при разборе.

Демо json-формата: https://asciinema.org/a/fyPXgRwGaMJjsWZP

Пакет можно использовать и как библиотеку:

```js
import genDiff from '@hexlet/code';

const diff = genDiff(filepath1, filepath2);
console.log(diff);
```

<!-- Добавьте примеры запуска и запись asciinema — именно это смотрит работодатель -->

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
