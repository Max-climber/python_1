# Как запушить изменения в свой форк (не в erupto15/python_1)

Репо сейчас смотрит на оригинал: `origin` → https://github.com/erupto15/python_1.git

## Шаги

### 1. Создай форк на GitHub

- Открой https://github.com/erupto15/python_1
- Нажми **Fork** (справа сверху)
- Форк появится у тебя: `https://github.com/ТВОЙ_НИК/python_1`

### 2. Добавь форк как remote и запушь

Из папки репозитория (где лежит этот файл) выполни в терминале, **подставив свой GitHub-ник** вместо `ТВОЙ_НИК`:

```bash
git remote add myfork https://github.com/ТВОЙ_НИК/python_1.git
git push -u myfork main
```

Если remote с именем `myfork` уже есть — сначала удали: `git remote remove myfork`, затем команды выше.

### 3. Ссылка для другого пользователя

Дай ему ссылку на **твой форк**:

**https://github.com/ТВОЙ_НИК/python_1**

Пусть клонирует его (не оригинал erupto15/python_1), тогда у него будут и тесты, и инструкция в `Lesson_11/TESTING.md`.

---

Проект не зависит от ClimbBox: в коде нет ссылок на ClimbBox, это отдельный репозиторий.
