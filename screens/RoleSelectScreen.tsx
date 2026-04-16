// ... 前面 import 部分保持不變 ...

      <Animated.View entering={FadeInDown.delay(900).duration(600)}>
        <View style={styles.footerContainer}>
          <Text style={styles.footer}>Works offline • iOS & Android</Text>
          <Text style={styles.copyright}>© 2026 SKWSCOUT. All rights reserved.</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... 其他 styles 保持不變 ...

  // 修改及新增 footer 相關樣式
  footerContainer: {
    paddingBottom: 10,
    alignItems: 'center',
  },
  footer: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 4,
  },
  copyright: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.6,
    letterSpacing: 0.5,
  }
});
