import './IconButton.scss';
import { Link } from 'react-router';
import React, { Component, PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';
import { addIconToLocalStorage, deleteIconInLocalStorage } from '../../../actions/cart';
import Icon from '../Icon/Icon.jsx';
import { autobind } from 'core-decorators';
import process from 'process';
let ClipboardButton = () => <br />;

/* eslint-disable global-require */
if (process.browser) {
  ClipboardButton = require('react-clipboard.js');
}
/* eslint-enable global-require */

@connect(
  state => ({
    iconsInLocalStorage: state.cart.iconsInLocalStorage,
    iconSize: state.repository.iconSize,
    userInfo: state.user.info,
  }),
  {
    addIconToLocalStorage,
    deleteIconInLocalStorage,
  }
)
class IconButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      copytipShow: false,
      copyError: false,
      showDownLoadDial: false,
    };
  }

  getScreenDist(element) {
    let actualLeft = element.offsetLeft;
    let actualTop = element.offsetTop;
    let current = element.offsetParent;
    while (current !== null) {
      actualLeft += current.offsetLeft;
      actualTop += current.offsetTop;
      current = current.offsetParent;
    }
    const { scrollTop, scrollLeft } = document.body;
    return {
      screenLeft: actualLeft - scrollLeft,
      screenTop: actualTop - scrollTop,
    };
  }

  addCartAnim() {
    const iconNode = findDOMNode(this.refs.icon);
    const { screenLeft, screenTop } = this.getScreenDist(iconNode);
    const iconCopy = iconNode.cloneNode(true);
    iconCopy.style.cssText += `
      top: ${iconNode.offsetTop}px;
      left: ${iconNode.offsetLeft}px;
      transition: transform 0.25s ease-in;
      position: absolute;
      z-index: 1000;
    `;
    iconCopy.getElementsByTagName('path')[0].style.fill = '#008ed6';
    document.body.appendChild(iconCopy);
    setTimeout(() => {
      iconCopy.style.transform = `translate(${917 - screenLeft}px, ${10 - screenTop}px)`;
    }, 0);
    setTimeout(() => {
      iconCopy.remove();
    }, 400);
  }

  removeCartAnim() {
    const iconNode = findDOMNode(this.refs.icon);
    const { scrollTop, scrollLeft } = document.body;
    const iconCopy = iconNode.cloneNode(true);
    iconCopy.style.cssText += `
      top: ${scrollTop + 20}px;
      left: ${scrollLeft + 915}px;
      transition: transform 0.25s ease-in;
      position: absolute;
      z-index: 1000;
    `;
    document.body.appendChild(iconCopy);
    setTimeout(() => {
      iconCopy.style.transform = 'translate(-100px, -100px)';
    }, 0);
    setTimeout(() => {
      iconCopy.remove();
    }, 400);
  }

  @autobind
  copySuccess() {
    this.setState({
      copytipShow: true,
      copyError: false,
    });
  }
  // 待完成：copy失败(safari下)，提示按 ⌘-C 完成复制
  @autobind
  copyError() {
    this.setState({
      copytipShow: false,
      copyError: true,
    });
  }
  @autobind
  copyEnd() {
    this.setState({
      copytipShow: false,
    });
  }

  isSelected(id) {
    if (this.props.iconsInLocalStorage.indexOf(id) !== -1) {
      return true;
    }
    return false;
  }

  selectIcon(id) {
    return () => {
      if (this.props.iconsInLocalStorage.indexOf(id) !== -1) {
        this.props.deleteIconInLocalStorage(id);
        this.removeCartAnim();
      } else {
        this.props.addIconToLocalStorage(id);
        this.addCartAnim();
      }
    };
  }
  @autobind
  deleteIcon() {
    const iconItem = {
      name: this.props.icon.name,
      id: this.props.icon.id,
    };
    this.props.delete(iconItem);
  }

  render() {
    const { icon, userInfo, download, repoId, toolBtns } = this.props;
    const selected = this.isSelected(icon.id);
    const fill = selected ? '#008ed6' : '#555f6e';
    const repositoryId = repoId || (icon.repoVersion && icon.repoVersion.repositoryId);

    // 登录状态：1：未登录  2：普通用户登录  3：管理员登录
    let status = 1;
    if (userInfo.login) {
      status = 2;
      if (userInfo.repoAdmin.indexOf(repositoryId) !== -1 || userInfo.admin) {
        status = 3;
      }
    }

    const toolList = {
      copytip:
        <span
          className={`copytip ${this.state.copytipShow ? 'show' : ''}`}
          key="copytip"
        >
          <i className="iconfont">&#xf078;</i>
          {this.state.copyError ? '再按 ⌘-C' : '复制成功！'}
        </span>,
      download:
        <i
          className={"tool-item iconfont download"}
          title="下载图标"
          onClick={download}
          key="download"
        >&#xf50b;</i>,
      edit:
        <Link to={`/replacement?fromId=${icon.id}`} key="edit">
          <i className={"tool-item iconfont edit"} title="图标替换">&#xf515;</i>
        </Link>,
      copy:
        <ClipboardButton
          component="i"
          className={"tool-item iconfont copy"}
          button-title="复制图标"
          data-clipboard-text={String.fromCharCode(icon.code)}
          onSuccess={this.copySuccess}
          onError={this.copyError}
          button-onMouseOut={this.copyEnd}
          key="copy"
        >&#xf514;</ClipboardButton>,
      cart:
        <i
          className={"tool-item iconfont car"}
          onClick={this.selectIcon(icon.id)}
          title="加入小车"
          key="cart"
        >&#xf50f;</i>,
      delete:
        <i
          className={"tool-item iconfont"}
          onClick={this.deleteIcon}
          title="删除"
          key="delete"
        >&#xf513;</i>,
    };
    const tools = [];
    toolBtns.forEach((btn) => {
      if (btn !== 'edit') {
        tools.push(toolList[btn]);
      } else if (+status === +3) {
        tools.push(toolList[btn]);
      }
    });
    return (
      <div className={`icon-detail-item ${selected ? 'active' : ''}`}>
        <div className={"info"}>
          <div className={"icon"} onClick={this.selectIcon(icon.id)}>
            <Icon
              size={this.props.iconSize}
              fill={fill} d={icon.path}
              ref="icon"
            />
          </div>
          <div className={"name"} title={icon.name}>{icon.name}</div>
          <div className={"code"}>{`&#x${icon.code.toString(16)};`}</div>
        </div>
        <div className="tool">
          {tools}
        </div>
      </div>
    );
  }
}

IconButton.defaultProps = {
  delete: () => {},
};

IconButton.propTypes = {
  icon: PropTypes.object,
  userInfo: PropTypes.object,
  iconSize: PropTypes.number,
  repoId: PropTypes.number,
  iconsInLocalStorage: PropTypes.array,
  toolBtns: PropTypes.array,
  deleteIconInLocalStorage: PropTypes.func,
  addIconToLocalStorage: PropTypes.func,
  download: PropTypes.func,
  delete: PropTypes.func,
};

export default IconButton;
