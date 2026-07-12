/**
 * Google Apps Script용 응답 저장 코드
 * 1) 새 Google Sheet를 만든 뒤 주소에서 스프레드시트 ID를 복사합니다.
 * 2) 아래 SPREADSHEET_ID를 바꿉니다.
 * 3) Apps Script를 웹 앱으로 배포하고 실행 권한을 허용합니다.
 * 4) 배포 URL을 script.js의 CONFIG.SUBMIT_ENDPOINT에 붙여 넣습니다.
 */

const SPREADSHEET_ID = "여기에_구글_스프레드시트_ID_입력";
const SHEET_NAME = "responses";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    validatePayload_(payload);

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "serverTimestamp",
        "participantNumber",
        "condition",
        "q1",
        "q2",
        "q3",
        "q4",
        "q5",
        "rawTotal",
        "adjustedPositivityScore",
        "startedAt",
        "completedAt",
        "durationMs"
      ]);
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      new Date(),
      payload.participantNumber,
      payload.condition,
      payload.responses[0],
      payload.responses[1],
      payload.responses[2],
      payload.responses[3],
      payload.responses[4],
      payload.rawTotal,
      payload.adjustedPositivityScore,
      payload.startedAt,
      payload.completedAt,
      payload.durationMs
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function validatePayload_(payload) {
  if (!payload || !Array.isArray(payload.responses) || payload.responses.length !== 5) {
    throw new Error("잘못된 응답 형식입니다.");
  }

  const allValid = payload.responses.every((value) => Number.isInteger(value) && value >= 1 && value <= 10);
  if (!allValid) {
    throw new Error("응답 점수는 1부터 10 사이의 정수여야 합니다.");
  }

  if (!["happy", "angry"].includes(payload.condition)) {
    throw new Error("조건 값이 올바르지 않습니다.");
  }
}
