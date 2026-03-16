# IBSheet8 호환성 매트릭스

## 비교 기준 문서

아래 IBSheet8 매뉴얼 문서를 현재 비교 기준으로 사용했다.

- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\appx\basic-course.html`
  - 조회, 페이징 조회, 저장, 저장 JSON 구조
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\appx\header.html`
  - 헤더, HeaderCheck, 컬럼 제어
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\appx\init-structure.html`
  - 필터, 그룹, 좌측 고정 컬럼
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\events\on-before-paste.html`
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\events\on-after-paste.html`
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\events\on-after-save.html`
- `C:\Users\kms\Downloads\ibsheet8-manual_v260311-0934\docs\events\on-after-row-copy.html`

## 현재 판단

### 구현 완료

- 행 선택 + 범위 선택 + 범위 복사/붙여넣기
- 저장 번들 / 변경 상태 분리
- 헤더 메뉴
  - 정렬
  - 숨김
  - 좌우 고정
  - 폭 초기화
- in-grid filter row
- delete-check 기반 삭제 의도 표시
- xlsx import / export / template
- actual render path row virtualization 기반 대용량 bench
- Playwright 브라우저 회귀

### 부분 구현

- 날짜 editor
  - foundation 구현 완료
  - host holiday policy helper 제공
  - disabled reason UX는 추가 보강 필요
- 행 복사 lifecycle parity
  - 동작은 있으나 IBSheet처럼 public row-copy event surface는 아직 없음
- paste lifecycle parity
  - summary, validation, skip reason은 있으나 `onBeforePaste`, `onAfterPaste` 같은 public hook은 아직 없음
- 저장 lifecycle parity
  - save bundle은 있으나 `onAfterSave` 같은 public callback 체계는 아직 없음

### 미구현

- HeaderCheck 기반 전체 체크
- Group / Tree / Pivot 계열
- IBSheet public event parity
  - `onBeforePaste`
  - `onAfterPaste`
  - `onAfterSave`
  - `onAfterRowCopy`

## 제품 관점 해석

- 현재 VibeGrid는 `업무형 그리드 파일럿`로는 충분한 수준이다.
- 다만 `IBSheet API 호환`이 아니라 `IBSheet 운영 UX 대체` 관점으로 봐야 한다.
- 즉, 현재 수준은 “실제 업무 화면 파일럿 가능”이고, “완전한 IBSheet 대체 표준”은 아직 아니다.

## 다음 우선순위

1. Compatibility Lab 화면을 이 문서 기준으로 유지한다.
2. HeaderCheck 전체 체크를 제품 backlog에서 별도로 판단한다.
3. paste/save/copy lifecycle hook을 public contract로 열지 결정한다.
4. Group / Tree / Pivot은 실제 수요 기반으로 다시 판정한다.
