# Claude Code 効果音通知

## 概要

Claude Code の処理完了時に効果音を再生する機能です。この機能により、長時間かかる処理の完了を音で知ることができます。

## 仕組み

- `.claude/settings.json` に設定された `SessionEnd` フックが、Claude のセッション完了時にスクリプトを実行します
- `scripts/play-sound.sh` が `sounds/Ping.aiff` を3回再生します

## 設定内容

`.claude/settings.json`:

```json
{
  "hooks": {
    "SessionEnd": {
      "*": "./scripts/play-sound.sh"
    }
  }
}
```

- `SessionEnd`: Claude Code のセッション終了時に実行されるフック
- `"*"`: すべてのツールにマッチするワイルドカード
- `"./scripts/play-sound.sh"`: 実行するスクリプトのパス（プロジェクトルートからの相対パス）

## 対応 OS と使用される効果音

### macOS

- `afplay` コマンドを使用
- `sounds/Ping.aiff` を3回連続で再生

### Linux

- `paplay` または `aplay` コマンドを使用
- FreeDesktop の標準完了音 `complete.oga` を3回連続で再生

### フォールバック

- 音声再生コマンドが利用できない場合は、ターミナルのビープ音（`\a`）を3回鳴らします

## カスタマイズ

効果音を変更したい場合は、`scripts/play-sound.sh` を編集してください：

```bash
# macOS の場合
afplay /System/Library/Sounds/[お好みの音].aiff

# Linux の場合
paplay /usr/share/sounds/[お好みの音].oga
```

利用可能な macOS システム効果音：

- `Basso.aiff`
- `Blow.aiff`
- `Bottle.aiff`
- `Frog.aiff`
- `Funk.aiff`
- `Glass.aiff`（デフォルト）
- `Hero.aiff`
- `Morse.aiff`
- `Ping.aiff`
- `Pop.aiff`
- `Purr.aiff`
- `Sosumi.aiff`
- `Submarine.aiff`
- `Tink.aiff`

## 無効化

効果音を無効にしたい場合は、`.claude/settings.json` からフック設定を削除してください：

```json
{
  "hooks": {}
}
```

または、ファイル全体を削除しても構いません。

## トラブルシューティング

### 効果音が鳴らない

1. スクリプトに実行権限があるか確認してください：

   ```bash
   ls -l scripts/play-sound.sh
   ```

   実行権限がない場合は付与してください：

   ```bash
   chmod +x scripts/play-sound.sh
   ```

2. 音声再生コマンドが利用可能か確認してください：

   ```bash
   # macOS
   which afplay

   # Linux
   which paplay
   which aplay
   ```

3. `.claude/settings.json` のパスが正しいか確認してください（プロジェクトルートからの相対パス）

### ビープ音が鳴ってしまう

OS の標準音声再生コマンドが見つからない場合、フォールバックとしてビープ音が鳴ります。適切なコマンドをインストールしてください：

- macOS: システム標準で `afplay` が利用可能です
- Linux: `pulseaudio-utils`（paplay）または `alsa-utils`（aplay）をインストールしてください
