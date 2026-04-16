# 📡 Radar Hunt — 城市追蹤尋寶 App

一個用於城市定向 / 雷達尋寶的跨平台應用程式。  
領袖可以在地圖上投放 Checkpoint，成員用雷達追蹤並找到它們。

## ✨ 功能

### 👑 領袖模式
- 在**實境地圖**上點擊投放 Checkpoint（支援搜尋地點）
- 每個 CP 可設定：Emoji 標記、文字內容、圖片 URL、偵測半徑、提示
- Quick Drop 一鍵快速投放 / 詳細編輯後投放
- 以 **QR Code / JSON / Compact 格式**導出地圖給成員
- 地圖自由縮放，適用於公園尋寶到全港城市定向

### 🔍 成員模式
- 以 **QR Code / JSON** 導入地圖
- **雷達視圖** — 動態掃描線 + 自動縮放，顯示最近 CP 方向和距離
- **實境地圖** — 暗色地圖底圖，顯示所有 CP、偵測半徑圈、你的位置
- **列表視圖** — 所有 CP 按距離排序，顯示已找到/未找到
- GPS 定位自動追蹤，走到 CP 偵測範圍內自動觸發
- CP 觸發後顯示文字內容和圖片

### 🎯 偵測半徑
- 3m / 5m / 10m / 20m / 50m（需要真正走到地點才觸發）

## 🚀 部署方式

### 方法一：Vercel（推薦）

1. **Fork / Clone 此 repo 到你的 GitHub**
2. **到 [vercel.com](https://vercel.com) 註冊並連接 GitHub**
3. **Import 此 repo**
4. Vercel 會自動讀取 `vercel.json` 設定，點擊 **Deploy**
5. 完成！你會得到一個 `https://your-project.vercel.app` 網址

> `vercel.json` 已配置好：
> - Build command: `npx expo export --platform web`
> - Output: `dist/`

### 方法二：手動部署

```bash
# 1. Clone
git clone https://github.com/YOUR_USER/radar-hunt.git
cd radar-hunt

# 2. 安裝依賴
npm install

# 3. 建構 Web 版本
npm run build:web

# 4. dist/ 資料夾就是靜態網站，可部署到任何靜態託管
```

### 方法三：手機 App（Expo Go）

```bash
npm install
npx expo start
```
用手機掃描 QR Code 即可在 Expo Go 中運行（支援 iOS / Android）。

### 方法四：獨立 App（EAS Build）

```bash
npm install -g eas-cli
eas build --platform ios    # 或 android
```

## 📁 專案結構

```
├── App.tsx                  # 主入口，路由管理
├── screens/
│   ├── RoleSelectScreen     # 選擇領袖/成員
│   ├── LeaderHomeScreen     # 領袖地圖列表
│   ├── LeaderEditScreen     # 領袖地圖編輯（實境地圖投放）
│   ├── MemberImportScreen   # 成員導入地圖
│   └── MemberRadarScreen    # 成員雷達/地圖/列表
├── components/
│   ├── LiveMapView          # Leaflet 實境地圖（暗色主題）
│   ├── RadarView            # 動態雷達動畫
│   ├── CheckpointCard       # CP 卡片
│   ├── CPDetailModal        # CP 詳情彈窗
│   ├── QRModal              # QR/JSON 導出導入
│   ├── EmojiPicker          # Emoji 選擇器
│   └── GlowButton           # 發光按鈕
├── lib/
│   ├── types.ts             # 類型定義
│   ├── colors.ts            # 暗色主題色彩
│   ├── storage.ts           # AsyncStorage 存儲
│   └── utils.ts             # 距離計算、編碼工具
├── vercel.json              # Vercel 部署設定
└── package.json
```

## 🛠 技術棧

- **React Native** + **Expo SDK 54**
- **TypeScript**
- **Leaflet** + OpenStreetMap（暗色 CartoDB 底圖）
- **react-native-reanimated**（雷達動畫）
- **AsyncStorage**（離線資料儲存）
- **expo-location**（GPS 定位）
- **expo-image**（圖片載入）

## 📝 License

MIT
