/**
 * Google Apps Script (GAS) 專用活動佐證文件、雲端備份存檔與內嵌圖片原生導出腳本
 * 
 * 適用說明：
 * 1. 打開包含活動佐證資料的 Google 文件或任意 Google 試算表。
 * 2. 點擊頂部選單【擴充功能】➔【Apps Script】。
 * 3. 清空原本的代碼，將本檔案下方的程式碼完整貼上。
 * 4. 點擊右上方【部署】➔【新建部署】➔ 類型選【網路應用程式 (Web app)】。
 * 5. 執行身分選擇【我 (您的帳號)】，存取權限選擇【任何人 (Anyone)】。
 * 6. 點擊【部署】，複製取得的 Web App 網址，即可在系統「雲端備份存檔」與「開啟雲端備份」一鍵同步 Google Drive！
 */

export const GAS_DOCUMENT_EXPORT_SCRIPT_CODE = `/**
 * BLIA 新竹青年分團 - Google Apps Script 雲端真存檔、簡報生成與佐證深度萃取服務
 * 支援功能：
 * 1. save_project_data: 將 activities、slides、設定與底圖存入 Google Drive 專屬 JSON 檔案
 * 2. load_project_data: 從 Google Drive 讀取指定或最新備份檔並還原
 * 3. export_to_google_slides: 將前端滿版投影片影像逐頁解碼並以二進位 Blob 滿版寫入全新 Google 簡報
 * 4. export_document: Google 文件活動與高畫質照片原生萃取
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var action = "";
  if (e && e.parameter && e.parameter.action) {
    action = e.parameter.action;
  }
  
  var postJson = null;
  if (e && e.postData && e.postData.contents) {
    try {
      postJson = JSON.parse(e.postData.contents);
      if (postJson && postJson.action) {
        action = postJson.action;
      }
    } catch(err) {}
  }

  if (action === "save_project_data") {
    return handleSaveProjectData(postJson || (e ? e.parameter : {}));
  } else if (action === "load_project_data") {
    return handleLoadProjectData(postJson || (e ? e.parameter : {}));
  } else if (action === "export_to_google_slides") {
    return handleExportToGoogleSlides(postJson || (e ? e.parameter : {}));
  } else if (action === "export_document" || (e && e.parameter && (e.parameter.docId || e.parameter.docUrl)) || (postJson && (postJson.docId || postJson.docUrl))) {
    return handleExportRequest(e);
  } else {
    return createJsonResponse({
      status: "error",
      message: "未知的請求操作 (action: " + (action || "未指定") + ")。請指定 save_project_data, load_project_data, export_to_google_slides 或 export_document。"
    });
  }
}

/**
 * 1. 雲端真存檔 (Google Drive) - action: 'save_project_data'
 */
function handleSaveProjectData(payload) {
  try {
    var rawPackage = payload.data || payload.package || payload;
    var fileName = payload.fileName || "hsinchu_youth_report_data.json";
    var folderName = "BLIA_青年分團專案雲端備份";

    // 尋找或建立專屬備份資料夾
    var folders = DriveApp.getFoldersByName(folderName);
    var targetFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var contentStr = typeof rawPackage === "string" ? rawPackage : JSON.stringify(rawPackage, null, 2);

    // 檢查資料夾內是否已有同名檔案
    var files = targetFolder.getFilesByName(fileName);
    var file;
    if (files.hasNext()) {
      file = files.next();
      file.setContent(contentStr);
    } else {
      file = targetFolder.createFile(fileName, contentStr, MimeType.PLAIN_TEXT);
    }
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var nowIso = new Date().toISOString();

    return createJsonResponse({
      status: "success",
      action: "save_project_data",
      fileId: file.getId(),
      fileName: file.getName(),
      updatedAt: nowIso,
      fileSize: file.getSize(),
      folderName: folderName,
      message: "成功將專案資料儲存至 Google Drive (" + folderName + "/" + fileName + ")"
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      action: "save_project_data",
      message: "儲存至 Google Drive 失敗: " + err.toString()
    });
  }
}

/**
 * 2. 雲端讀取 (Google Drive) - action: 'load_project_data'
 */
function handleLoadProjectData(payload) {
  try {
    var fileId = payload.fileId || "";
    var fileName = payload.fileName || "hsinchu_youth_report_data.json";
    var file = null;

    if (fileId) {
      file = DriveApp.getFileById(fileId);
    } else {
      var folderName = "BLIA_青年分團專案雲端備份";
      var folders = DriveApp.getFoldersByName(folderName);
      if (folders.hasNext()) {
        var folder = folders.next();
        var files = folder.getFilesByName(fileName);
        if (files.hasNext()) {
          file = files.next();
        }
      }
      if (!file) {
        var rootFiles = DriveApp.getFilesByName(fileName);
        if (rootFiles.hasNext()) {
          file = rootFiles.next();
        }
      }
    }

    if (!file) {
      return createJsonResponse({
        status: "error",
        action: "load_project_data",
        message: "在 Google Drive 找不到備份檔案「" + fileName + "」" + (fileId ? " (ID: " + fileId + ")" : "")
      });
    }

    var contentStr = file.getBlob().getDataAsString();
    var parsedData = JSON.parse(contentStr);

    return createJsonResponse({
      status: "success",
      action: "load_project_data",
      fileId: file.getId(),
      fileName: file.getName(),
      updatedAt: file.getLastUpdated().toISOString(),
      data: parsedData,
      message: "成功從 Google Drive 載入專案資料"
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      action: "load_project_data",
      message: "讀取雲端備份失敗: " + err.toString()
    });
  }
}

/**
 * 3. 網頁投影片一鍵直轉 Google 簡報 - action: 'export_to_google_slides'
 * 接收前端 html2canvas 逐頁產生的滿版 JPEG Base64 影像，解碼為原生二進位 Blob，
 * 並在新建的 Google 簡報中建立空白投影片滿版嵌入 (720pt x 405pt)，最後強制 saveAndClose()。
 */
function handleExportToGoogleSlides(payload) {
  try {
    var title = payload.title || "新竹青年分團工作報告簡報";
    var slidesData = payload.slides || [];
    
    if (slidesData.length === 0) {
      return createJsonResponse({
        status: "error",
        action: "export_to_google_slides",
        message: "未接收到任何投影片影像資料"
      });
    }

    // 1. 建立全新 Google 簡報
    var presentation = SlidesApp.create(title);
    var pWidth = presentation.getPageWidth();   // 標準 16:9 寬度 (720pt)
    var pHeight = presentation.getPageHeight(); // 標準 16:9 高度 (405pt)
    var initialSlides = presentation.getSlides();

    // 2. 逐頁解碼 Base64 並以 Blob 滿版寫入
    slidesData.forEach(function(slideItem, index) {
      var rawBase64 = slideItem.imageData || "";
      if (rawBase64.indexOf(",") > -1) {
        rawBase64 = rawBase64.split(",")[1];
      } else {
        rawBase64 = rawBase64.replace(/^data:[^;]+;base64,/, "");
      }
      rawBase64 = rawBase64.replace(/\\s/g, "");
      var decodedBytes = Utilities.base64Decode(rawBase64);
      var imageBlob = Utilities.newBlob(decodedBytes, 'image/jpeg', 'slide_' + (index + 1) + '.jpg');

      var slide;
      if (index === 0 && initialSlides.length > 0) {
        slide = initialSlides[0];
        // 清除預設頁面的標題佔位符
        var elements = slide.getPageElements();
        for (var i = elements.length - 1; i >= 0; i--) {
          elements[i].remove();
        }
      } else {
        slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
      }

      // 16:9 滿版貼合置入影像 (x: 0, y: 0, w: 720, h: 405)
      slide.insertImage(imageBlob, 0, 0, pWidth, pHeight);
    });

    // 3. 強制持久化儲存
    presentation.saveAndClose();

    // 4. 設定權限為「知道連結者可檢視」並回傳公開 URL
    var file = DriveApp.getFileById(presentation.getId());
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return createJsonResponse({
      status: "success",
      action: "export_to_google_slides",
      presentationId: presentation.getId(),
      presentationUrl: presentation.getUrl(),
      totalSlides: slidesData.length,
      message: "成功生成 Google 簡報，共寫入 " + slidesData.length + " 頁！"
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      action: "export_to_google_slides",
      message: "生成 Google 簡報失敗：" + err.toString()
    });
  }
}

/**
 * 4. 既有文件佐證萃取邏輯
 */
function handleExportRequest(e) {
  try {
    var docId = "";
    if (e && e.parameter) {
      docId = e.parameter.docId || "";
      if (!docId && e.parameter.docUrl) {
        var match = e.parameter.docUrl.match(/\\/d\\/([a-zA-Z0-9_-]+)/);
        if (match) docId = match[1];
      }
    }
    
    // 若透過 POST body 傳遞 JSON
    if (!docId && e && e.postData && e.postData.contents) {
      try {
        var postJson = JSON.parse(e.postData.contents);
        docId = postJson.docId || "";
        if (!docId && postJson.docUrl) {
          var m = postJson.docUrl.match(/\\/d\\/([a-zA-Z0-9_-]+)/);
          if (m) docId = m[1];
        }
      } catch (err) {}
    }

    if (!docId) {
      return createJsonResponse({
        status: "error",
        message: "請提供有效的 Google 文件 ID (docId) 或完整分享網址 (docUrl)"
      });
    }

    // 1. 開啟目標 Google 文件
    var doc = DocumentApp.openById(docId);
    var body = doc.getBody();
    var docTitle = doc.getName() || "Google 雲端活動佐證文件";

    // 2. 準備存放提取圖片的 Google Drive 資料夾
    var folderName = "BLIA_活動佐證照片導出庫";
    var folders = DriveApp.getFoldersByName(folderName);
    var targetFolder;
    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      targetFolder = DriveApp.createFolder(folderName);
    }
    targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 3. 提取 Google 文件中所有原生 InlineImages
    var inlineImages = body.getImages();
    var extractedPhotos = [];

    inlineImages.forEach(function(img, index) {
      try {
        var blob = img.getBlob();
        var file = targetFolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        var fileId = file.getId();
        var photoUrl = "https://lh3.googleusercontent.com/d/" + fileId;
        
        extractedPhotos.push({
          id: fileId,
          url: photoUrl,
          caption: "Google 雲端文件佐證照片 " + (index + 1),
          name: "doc_img_" + (index + 1)
        });
      } catch (imgErr) {
        Logger.log("提取圖片失敗 (" + index + "): " + imgErr.toString());
      }
    });

    // 4. 解析表格與段落結構，提取活動
    var tables = body.getTables();
    var activities = [];

    if (tables.length > 0) {
      tables.forEach(function(table, tblIdx) {
        var numRows = table.getNumRows();
        var fullTableText = "";
        var grid = [];

        for (var r = 0; r < numRows; r++) {
          var row = table.getRow(r);
          var rowCells = [];
          for (var c = 0; c < row.getNumCells(); c++) {
            rowCells.push(row.getCell(c).getText().trim());
          }
          grid.push(rowCells);
          fullTableText += rowCells.join(" ") + "\\n";
        }

        if (fullTableText.indexOf("活動名稱") !== -1 || fullTableText.indexOf("活動日期") !== -1 || fullTableText.indexOf("選拔活動佐證") !== -1) {
          var headerIndices = [];
          for (var rIdx = 0; rIdx < grid.length; rIdx++) {
            var rowText = grid[rIdx].join(" ");
            if (
              (rowText.indexOf("活動名稱") !== -1 && rowText.indexOf("活動內容") === -1) ||
              rowText.indexOf("選拔活動佐證資料表") !== -1 ||
              (rowText.indexOf("活動日期") !== -1 && (headerIndices.length === 0 || rIdx > headerIndices[headerIndices.length - 1] + 3))
            ) {
              headerIndices.push(rIdx);
            }
          }

          if (headerIndices.length === 0) headerIndices.push(0);

          headerIndices.forEach(function(hIdx, aIdx) {
            var nextHIdx = (aIdx + 1 < headerIndices.length) ? headerIndices[aIdx + 1] : grid.length;
            var subGrid = grid.slice(hIdx, nextHIdx);
            var subText = subGrid.map(function(r) { return r.join(" "); }).join("\\n");

            var actTitle = extractField(subText, /(?:活動名稱|專案名稱)[：:\\s]*([^\\n]+)/) || ("佛光青年專案活動 " + (activities.length + 1));
            var actDate = extractField(subText, /(?:活動日期|辦理日期)[：:\\s]*([^\\n]+)/) || "2026-06-20";
            var actLoc = extractField(subText, /(?:活動地點|辦理地點)[：:\\s]*([^\\n]+)/) || "佛光山法寶寺";
            var actSummary = extractField(subText, /(?:活動內容簡述|活動內容|專案簡述)[：:\\s]*([\\s\\S]*?)(?:活動照片|圖說|圖書|$)/) || "活動如期圓滿舉辦，青年幹部群熱忱投入。";

            var totalMatch = subText.match(/總共\\s*(\\d+)\\s*人/) || subText.match(/(\\d+)\\s*人/);
            var attendeeTotal = totalMatch ? parseInt(totalMatch[1], 10) : 25;

            var captions = [];
            var capMatches = subText.matchAll(/(?:圖說|圖書)[:：\\s]+((?:(?!(?:圖說|圖書))[\\s\\S])*?)(?=(?:圖說|圖書)|\\n|$)/gi);
            for (var m of capMatches) {
              var c = m[1].replace(/^[：:\\s]+/, '').trim();
              if (c && c.length > 1 && c.indexOf("至少") === -1 && c.indexOf("請檢附") === -1) {
                captions.push(c);
              }
            }

            var startPhotoIdx = activities.length * 2;
            var assignedPhotos = [];
            if (extractedPhotos.length > 0) {
              var p1 = extractedPhotos[startPhotoIdx];
              var p2 = extractedPhotos[startPhotoIdx + 1];
              if (p1) {
                assignedPhotos.push({
                  id: p1.id,
                  url: p1.url,
                  caption: captions[0] ? ("圖說：" + captions[0]) : (actTitle + " - 現場實況照片 1")
                });
              }
              if (p2) {
                assignedPhotos.push({
                  id: p2.id,
                  url: p2.url,
                  caption: captions[1] ? ("圖說：" + captions[1]) : (actTitle + " - 現場實況照片 2")
                });
              }
            }

            activities.push({
              id: "gas-act-" + (activities.length + 1) + "-" + Date.now(),
              selected: true,
              title: actTitle.trim(),
              category: detectCategory(actTitle, actSummary),
              activityNature: "國際佛光會分團專案活動",
              activityObjective: "以文化弘揚佛法 ✕ 以教育培養人才",
              date: normalizeDate(actDate),
              timeRange: actDate.trim(),
              location: actLoc.trim(),
              organizer: "國際佛光會中華佛光青年總團 / 新竹青年分團",
              guidingUnit: "佛光山法寶寺",
              leadCadres: ["吳浩君", "周汶蔚", "徐信銓"],
              attendeeTotal: attendeeTotal,
              attendeeYouth: Math.round(attendeeTotal * 0.8),
              attendeeGuests: Math.round(attendeeTotal * 0.1),
              attendeeVolunteers: Math.round(attendeeTotal * 0.1),
              summary: actSummary.trim(),
              processSchedule: "前期籌備 ➔ 活動實施 ➔ 成效檢討",
              highlights: ["【活動落實推動】：" + actTitle.trim() + " 圓滿完成。"],
              suggestions: ["持續擴大青年號召參與。"],
              quantitativeMetrics: [{ name: "參與人次", value: attendeeTotal + " 人", benchmark: "符合標準" }],
              photos: assignedPhotos,
              sourceFileType: "google_docs",
              status: "extracted",
              rawTextPreview: subText.slice(0, 300)
            });
          });
        }
      });
    }

    return createJsonResponse({
      status: "success",
      docTitle: docTitle,
      totalActivities: activities.length,
      totalPhotosExtracted: extractedPhotos.length,
      activities: activities
    });

  } catch (globalErr) {
    return createJsonResponse({
      status: "error",
      message: "執行失敗：" + globalErr.toString()
    });
  }
}

// 輔助函式：提取字串欄位
function extractField(text, regex) {
  var match = text.match(regex);
  return (match && match[1]) ? match[1].trim() : "";
}

// 輔助函式：日期正規化為 YYYY-MM-DD
function normalizeDate(dateStr) {
  var m = dateStr.match(/(\\d{4})[\\/\\-](\\d{1,2})[\\/\\-](\\d{1,2})/);
  if (m) {
    var mm = m[2].length === 1 ? "0" + m[2] : m[2];
    var dd = m[3].length === 1 ? "0" + m[3] : m[3];
    return m[1] + "-" + mm + "-" + dd;
  }
  return "2026-06-20";
}

// 輔助函式：活動類別自動判定
function detectCategory(title, summary) {
  var text = (title + " " + summary).toLowerCase();
  if (text.indexOf("書院") !== -1 || text.indexOf("讀書會") !== -1 || text.indexOf("法華經") !== -1 || text.indexOf("佛學會考") !== -1) {
    return "青年書院與讀書會";
  } else if (text.indexOf("法會") !== -1 || text.indexOf("共修") !== -1 || text.indexOf("三皈五戒") !== -1 || text.indexOf("年會") !== -1) {
    return "分團例會與法會";
  } else if (text.indexOf("健走") !== -1 || text.indexOf("生活禪") !== -1 || text.indexOf("跑") !== -1 || text.indexOf("羽球") !== -1) {
    return "生活禪與健走";
  } else if (text.indexOf("義工") !== -1 || text.indexOf("出坡") !== -1 || text.indexOf("蔬食") !== -1 || text.indexOf("大掃除") !== -1) {
    return "義工服務與蔬食";
  }
  return "青年培訓與研習";
}

// 建立 CORS 友好的 JSON 回應
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
