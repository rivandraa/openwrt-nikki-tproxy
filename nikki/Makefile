include $(TOPDIR)/rules.mk

PKG_NAME:=nikki
<<<<<<< LOCAL
PKG_RELEASE:=1

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/MetaCubeX/mihomo.git

PKG_SOURCE_DATE:=2026-02-08
PKG_SOURCE_VERSION:=97f25250a625117106490d62a5243156fde05dd9
PKG_MIRROR_HASH:=9ea4dca2f24b64d2e7ab054a3b10d12c079b7e252b4422da56fbd92ebadf588b

=======
PKG_VERSION:=2026.04.08
PKG_RELEASE:=1

>>>>>>> UPSTREAM
PKG_LICENSE:=GPL3.0+
PKG_MAINTAINER:=***

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

PKG_BUILD_VERSION:=v1.19.20
PKG_BUILD_TIME:=$(shell date -u -Iseconds)
PKG_VERSION:=$(PKG_SOURCE_DATE)~$(PKG_BUILD_VERSION)-Mod
#PKG_VERSION:=$(PKG_BUILD_VERSION)-Mod

GO_PKG:=github.com/metacubex/mihomo
GO_PKG_LDFLAGS_X:= \
	$(GO_PKG)/constant.Version=$(PKG_BUILD_VERSION) \
	$(GO_PKG)/constant.BuildTime=$(PKG_BUILD_TIME)
GO_PKG_TAGS:=with_gvisor

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/nikki
  SECTION:=net
  CATEGORY:=Network
<<<<<<< LOCAL
  TITLE:=A rule based proxy in Go.
  URL:=https://wiki.metacubex.one
  DEPENDS:=$(GO_ARCH_DEPENDS) +ca-bundle +yq +firewall4 +ip-full \
         +kmod-inet-diag +kmod-nft-socket +kmod-nft-tproxy \
         +kmod-tun +kmod-dummy
  PROVIDES:=mihomo
  ALTERNATIVES:=\
    300:/usr/bin/mihomo:/usr/libexec/nikki
=======
  TITLE:=Transparent Proxy with Mihomo on OpenWrt.
  URL:=https://github.com/nikkinikki-org
  DEPENDS:=$(GO_ARCH_DEPENDS) +ca-bundle +curl +yq firewall4 +ip-full +kmod-inet-diag +kmod-nft-socket +kmod-nft-tproxy +kmod-tun +kmod-dummy +mihomo
>>>>>>> UPSTREAM
endef

define Package/nikki/conffiles
/etc/config/nikki
/etc/nikki/mixin.yaml
endef

define Package/nikki/install
<<<<<<< LOCAL
	$(call GoPackage/Package/Install/Bin,$(PKG_INSTALL_DIR))

	$(INSTALL_DIR) $(1)/usr/libexec/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/mihomo $(1)/usr/libexec/nikki

	$(INSTALL_DIR) $(1)/etc/nikki \
	               $(1)/etc/nikki/ucode \
	               $(1)/etc/nikki/scripts \
	               $(1)/etc/nikki/nftables \
	               $(1)/etc/nikki/profiles \
	               $(1)/etc/nikki/subscriptions \
	               $(1)/etc/nikki/run \
	               $(1)/etc/nikki/run/providers \
	               $(1)/etc/nikki/run/providers/rule \
	               $(1)/etc/nikki/run/providers/proxy
=======
	$(INSTALL_DIR) $(1)/etc/nikki
	$(INSTALL_DIR) $(1)/etc/nikki/ucode
	$(INSTALL_DIR) $(1)/etc/nikki/scripts
	$(INSTALL_DIR) $(1)/etc/nikki/nftables
	$(INSTALL_DIR) $(1)/etc/nikki/profiles
	$(INSTALL_DIR) $(1)/etc/nikki/subscriptions
	$(INSTALL_DIR) $(1)/etc/nikki/run
	$(INSTALL_DIR) $(1)/etc/nikki/run/providers
	$(INSTALL_DIR) $(1)/etc/nikki/run/providers/rule
	$(INSTALL_DIR) $(1)/etc/nikki/run/providers/proxy
>>>>>>> UPSTREAM

	$(INSTALL_DATA) $(CURDIR)/files/mixin.yaml $(1)/etc/nikki/mixin.yaml

	$(INSTALL_BIN) $(CURDIR)/files/ucode/include.uc $(1)/etc/nikki/ucode/include.uc
	$(INSTALL_BIN) $(CURDIR)/files/ucode/mixin.uc $(1)/etc/nikki/ucode/mixin.uc
	$(INSTALL_BIN) $(CURDIR)/files/ucode/hijack.ut $(1)/etc/nikki/ucode/hijack.ut

	$(INSTALL_BIN) $(CURDIR)/files/scripts/include.sh $(1)/etc/nikki/scripts/include.sh
	$(INSTALL_BIN) $(CURDIR)/files/scripts/firewall_include.sh $(1)/etc/nikki/scripts/firewall_include.sh
	$(INSTALL_BIN) $(CURDIR)/files/scripts/debug.sh $(1)/etc/nikki/scripts/debug.sh

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) $(CURDIR)/files/nikki.conf $(1)/etc/config/nikki

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) $(CURDIR)/files/nikki.init $(1)/etc/init.d/nikki

	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) $(CURDIR)/files/uci-defaults/firewall.sh $(1)/etc/uci-defaults/99_firewall_nikki
	$(INSTALL_BIN) $(CURDIR)/files/uci-defaults/init.sh $(1)/etc/uci-defaults/99_init_nikki
	$(INSTALL_BIN) $(CURDIR)/files/uci-defaults/migrate.sh $(1)/etc/uci-defaults/99_migrate_nikki

	$(INSTALL_DIR) $(1)/lib/upgrade/keep.d
	$(INSTALL_DATA) $(CURDIR)/files/nikki.upgrade $(1)/lib/upgrade/keep.d/nikki
endef

define Package/nikki/postrm
#!/bin/sh
if [ -z $${IPKG_INSTROOT} ]; then
	uci -q batch <<-EOF > /dev/null
		del firewall.nikki
		commit firewall
	EOF
fi
endef

<<<<<<< LOCAL
define Package/nikki/postinst
#!/bin/sh
if [ -z "$${IPKG_INSTROOT}" ]; then
  if [ -d /www/tinyfm ]; then
    if [ ! -e /www/tinyfm/rootfs ]; then
      ln -s / /www/tinyfm/rootfs
    else
      if [ -L /www/tinyfm/rootfs ]; then
        if [ "$$(readlink /www/tinyfm/rootfs)" != "/" ]; then
          rm -f /www/tinyfm/rootfs
          ln -s / /www/tinyfm/rootfs
        fi
      fi
    fi
  fi
fi
exit 0
endef

define Build/Prepare
	$(Build/Prepare/Default)
	$(RM) -r $(PKG_BUILD_DIR)/rules/logic_test
=======
define Build/Compile

>>>>>>> UPSTREAM
endef

$(eval $(call GoBinPackage,nikki))
$(eval $(call BuildPackage,nikki))
