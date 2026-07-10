# 감정 전염 학교생활 설문

GitHub Pages에서 실행할 수 있는 HTML·CSS·JavaScript 기반 익명 설문입니다.

## 작동 방식

1. 참가자가 임의의 정수를 입력하고 참여에 동의합니다.
2. 기본 설정에서는 짝수 입력자가 `happy`, 홀수 입력자가 `angry` 조건에 배정됩니다.
3. 총 5개 문항을 한 페이지에 하나씩 제시합니다.
4. 문항 사이마다 해당 조건의 얼굴 자극을 200ms 동안 제시합니다.
5. 각 문항은 1~10점 원형 버튼으로 응답합니다.
6. 3번 문항은 부정 문항이므로 분석용 긍정성 점수에서는 `11 - 응답값`으로 역채점합니다.

## 파일 구조

- `index.html`: 설문 화면
- `style.css`: 디자인
- `script.js`: 조건 배정, 문항 진행, 200ms 자극, 점수 계산, 결과 전송
- `assets/happy.svg`: 시연용 긍정 표정 이미지
- `assets/angry.svg`: 시연용 부정 표정 이미지
- `Code.gs`: Google Sheets에 응답을 저장하기 위한 Google Apps Script 코드

## 이미지 교체

현재 SVG는 사이트 작동을 확인하기 위한 시연용 그림입니다. 실제 연구에서는 사용 허가를 받은 표준화 얼굴 사진을 권장합니다.

1. `assets` 폴더에 `happy.jpg`, `angry.jpg`를 넣습니다.
2. `script.js`에서 아래 값을 바꿉니다.

```js
HAPPY_IMAGE: "assets/happy.jpg",
ANGRY_IMAGE: "assets/angry.jpg"
```

두 이미지는 얼굴 크기, 배경, 밝기, 시선 방향, 해상도를 가능한 한 동일하게 맞추는 것이 좋습니다.

## 응답을 Google Sheets에 모으기

GitHub Pages만으로는 여러 참가자의 응답을 중앙에 영구 저장할 수 없습니다. 이 프로젝트는 Google Apps Script 웹 앱으로 Google Sheets에 저장하도록 구성되어 있습니다.

1. 새 Google Sheet를 만듭니다.
2. `확장 프로그램 → Apps Script`에서 `Code.gs` 내용을 붙여 넣습니다.
3. Google Sheet 주소의 `/d/`와 `/edit` 사이 문자열을 복사하여 `SPREADSHEET_ID`에 넣습니다.
4. Apps Script를 웹 앱으로 배포하고 접근 권한을 설문 참가자가 사용할 수 있도록 설정합니다.
5. 생성된 웹 앱 URL을 `script.js`의 `SUBMIT_ENDPOINT`에 붙여 넣습니다.

```js
SUBMIT_ENDPOINT: "https://script.google.com/macros/s/배포_ID/exec"
```

URL을 비워 두면 서버 전송 없이 참가자가 자신의 JSON 응답 파일을 내려받는 방식으로 작동합니다.

## GitHub Pages 게시

1. GitHub에서 새 저장소를 만듭니다.
2. 이 폴더 안의 파일과 `assets` 폴더를 저장소 최상위에 업로드합니다.
3. 저장소의 Pages 설정에서 배포 원본을 기본 브랜치의 루트 폴더로 지정합니다.
4. 생성된 Pages 주소로 접속해 모바일과 PC에서 모두 시험합니다.

## 연구 설계상 중요한 주의점

- 참가자가 직접 숫자를 고르면 짝수·홀수 선택이 완전한 무작위 배정이 아닙니다. 실제 무작위 배정을 원하면 `script.js`의 `ASSIGNMENT_MODE`를 `"random"`으로 바꾸는 것이 더 타당합니다.
- 200ms는 JavaScript 타이머 기준 목표값입니다. 브라우저 부하와 화면 주사율 때문에 실제 노출 시간이 약간 달라질 수 있습니다.
- 참가자에게는 설문 중 짧은 시각 자극이 있다는 사실과 중도 철회 가능성을 사전에 알리고, 종료 후 자극의 연구 목적을 설명하는 것이 좋습니다.
- 학생 대상 연구라면 담당 교사 또는 학교의 연구윤리 검토와 보호자 동의 필요 여부를 먼저 확인해야 합니다.
- 실제 인물 사진은 초상권과 이용 허가를 확인해야 하며, 조건 간에는 표정 외 요소가 달라지지 않도록 통제해야 합니다.
- 결과 분석 시 원점수 합계보다 3번 문항을 역채점한 `adjustedPositivityScore`를 사용하는 것이 문항 방향과 일치합니다.
