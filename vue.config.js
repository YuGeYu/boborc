module.exports = {
  publicPath: './',
  pages: {
    index: {
      entry: 'src/pages/lobby.js',
      template: 'public/index.html',
      filename: 'index.html',
      title: '大厅 | 啵啵小队出击'
    },
    levels: {
      entry: 'src/pages/levels.js',
      template: 'public/index.html',
      filename: 'levels.html',
      title: '关卡 | 啵啵小队出击'
    },
    battle: {
      entry: 'src/pages/battle.js',
      template: 'public/index.html',
      filename: 'battle.html',
      title: '战斗 | 啵啵小队出击'
    },
    shop: {
      entry: 'src/pages/shop.js',
      template: 'public/index.html',
      filename: 'shop.html',
      title: '角色图鉴 | 啵啵小队出击'
    },
    profile: {
      entry: 'src/pages/profile.js',
      template: 'public/index.html',
      filename: 'profile.html',
      title: '个人主页 | 啵啵小队出击'
    },
    world: {
      entry: 'src/pages/world.js',
      template: 'public/index.html',
      filename: 'world.html',
      title: '世界 | 啵啵小队出击'
    },
    equipment: {
      entry: 'src/pages/equipment.js',
      template: 'public/index.html',
      filename: 'equipment.html',
      title: '装备 | 啵啵小队出击'
    },
    saves: {
      entry: 'src/pages/saves.js',
      template: 'public/index.html',
      filename: 'saves.html',
      title: '存档中心 | 啵啵小队出击'
    },
    settings: {
      entry: 'src/pages/settings.js',
      template: 'public/index.html',
      filename: 'settings.html',
      title: '设置 | 啵啵小队出击'
    }
  },
  chainWebpack: config => {
    const rules = [
      { name: 'images', dir: 'img' },
      { name: 'media', dir: 'media' }
    ]

    rules.forEach(rule => {
      const ruleConf = config.module.rule(rule.name)

      ruleConf.uses.clear()

      ruleConf
        .use('file-loader')
        .loader('file-loader')
        .options({
          name: `${rule.dir}/[name].[hash:8].[ext]`
        })
    })
  },
  devServer: {
    hot: false
  }
}
