from typing import List, Tuple, Dict
import spacy
from spacy.tokens import Doc, Span
from spacy.training import Example
from spacy.util import filter_spans
import random

def parse_bio_tags(bio_line: str) -> List[str]:
    """Преобразует строку BIO-тегов в список."""
    return bio_line.strip().split()


def bio_tags_to_spans(tokens: List[str], tags: List[str]) -> List[Tuple[int, int, str]]:
    """
    Преобразует последовательность BIO-тегов в список спанов (начало_символа, конец_символа, метка).
    Предполагается, что токены уже разбиты и их длина в символах известна.
    Здесь возвращаем индексы токенов, позже пересчитаем в символьные позиции.
    """
    spans = []
    start_idx = None
    current_label = None
    for i, tag in enumerate(tags):
        if tag == 'O':
            if start_idx is not None:
                spans.append((start_idx, i, current_label))
                start_idx = None
                current_label = None
        elif tag.startswith('B-'):
            if start_idx is not None:
                spans.append((start_idx, i, current_label))
            start_idx = i
            current_label = tag[2:]
        elif tag.startswith('I-'):
            if start_idx is None:
                # I без B – игнорируем или можно начать с текущего
                continue
            # продолжаем текущую сущность
        else:
            # неизвестный тег – игнорируем
            continue
    if start_idx is not None:
        spans.append((start_idx, len(tokens), current_label))
    return spans


def create_doc_from_tokens(nlp: spacy.Language, tokens: List[str], tags: List[str] = None) -> Doc:
    """
    Создаёт Doc из списка токенов (разделители – пробелы).
    Если передан tags, выделяет сущности и записывает их в doc.ents.
    """
    # Определяем, были ли пробелы после каждого токена (кроме последнего)
    spaces = [True] * (len(tokens) - 1) + [False]
    doc = Doc(nlp.vocab, words=tokens, spaces=spaces)
    if tags:
        # получаем спаны в координатах токенов, потом преобразуем в символьные индексы
        token_spans = bio_tags_to_spans(tokens, tags)
        spans = []
        for start_token, end_token, label in token_spans:
            start_char = doc[start_token].idx
            end_char = doc[end_token - 1].idx + len(doc[end_token - 1])
            span = doc.char_span(start_char, end_char, label=label)
            if span is not None:
                spans.append(span)
        doc.ents = filter_spans(spans)
    return doc


def token_level_accuracy(nlp: spacy.Language, docs: List[Doc], gold_tags_list: List[List[str]]) -> float:
    """
    Вычисляет accuracy на уровне токенов: доля токенов,
    для которых предсказанный BIO-тег совпадает с истинным.
    """
    correct = 0
    total = 0
    for doc, gold_tags in zip(docs, gold_tags_list):
        # Предсказание сущностей для того же документа (токены те же)
        pred_doc = create_doc_from_tokens(nlp, [t.text for t in doc])  # восстанавливаем токены
        # Строим BIO-теги для предсказанных сущностей
        pred_tags = ['O'] * len(doc)
        for ent in pred_doc.ents:
            # определяем индексы токенов по символьным позициям
            start_token = None
            end_token = None
            for i, token in enumerate(doc):
                if token.idx == ent.start_char:
                    start_token = i
                if token.idx + len(token) == ent.end_char:
                    end_token = i
            if start_token is None or end_token is None:
                continue
            pred_tags[start_token] = f'B-{ent.label_}'
            for i in range(start_token + 1, end_token + 1):
                pred_tags[i] = f'I-{ent.label_}'
        # Сравниваем с истинными тегами
        for gt, pred in zip(gold_tags, pred_tags):
            if gt == pred:
                correct += 1
            total += 1
    return correct / total if total > 0 else 0.0


def train_ner_model(train_texts: List[str], train_labels: List[str],
                    n_iter: int = 10, batch_size: int = 100) -> spacy.Language:
    """
    Обучает модель NER с нуля на данных в формате BIO.
    Возвращает обученную модель.
    """
    # 1. Создаём пустой пайплайн русского языка
    nlp = spacy.blank("ru")
    ner = nlp.add_pipe("ner")

    # 2. Собираем все метки сущностей
    all_tags = set()
    for labels_line in train_labels:
        tags = parse_bio_tags(labels_line)
        for tag in tags:
            if tag != 'O' and tag.startswith(('B-', 'I-')):
                all_tags.add(tag[2:])
    for label in all_tags:
        ner.add_label(label)

    # 3. Создаём документы с правильной токенизацией и сущностями
    docs = []
    gold_tags_list = []
    for text, labels_line in zip(train_texts, train_labels):
        tokens = text.split()
        tags = parse_bio_tags(labels_line)
        if len(tokens) != len(tags):
            # Несоответствие длины – пропускаем или логируем
            continue
        doc = create_doc_from_tokens(nlp, tokens, tags)
        docs.append(doc)
        gold_tags_list.append(tags)

    if not docs:
        raise ValueError("Нет корректных примеров для обучения")

    # 4. Обучение
    optimizer = nlp.begin_training()
    for epoch in range(n_iter):
        random.shuffle(docs)
        losses = {}
        batches = [docs[i:i+batch_size] for i in range(0, len(docs), batch_size)]
        for batch in batches:
            examples = []
            for doc in batch:
                # Для каждого документа создаём Example с золотыми аннотациями
                gold_dict = {"entities": [(ent.start_char, ent.end_char, ent.label_) for ent in doc.ents]}
                examples.append(Example.from_dict(doc, gold_dict))
            nlp.update(examples, sgd=optimizer, losses=losses)
        # Можно добавить логирование потерь
        print(f"Epoch {epoch+1}/{n_iter}, Losses: {losses}")
    return nlp, docs, gold_tags_list