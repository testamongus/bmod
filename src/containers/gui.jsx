import PropTypes from 'prop-types';
import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';
import Modal from '../components/modal/modal.jsx';
import VM from 'scratch-vm';
import { injectIntl, intlShape } from 'react-intl';

import ErrorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import { getIsError, getIsShowingProject } from '../reducers/project-state';
import { activateTab, BLOCKS_TAB_INDEX, COSTUMES_TAB_INDEX, SOUNDS_TAB_INDEX } from '../reducers/editor-tab';
import { closeCostumeLibrary, closeBackdropLibrary, closeTelemetryModal, openExtensionLibrary } from '../reducers/modals';

import FontLoaderHOC from '../lib/font-loader-hoc.jsx';
import LocalizationHOC from '../lib/localization-hoc.jsx';
import SBFileUploaderHOC from '../lib/sb-file-uploader-hoc.jsx';
import ProjectFetcherHOC from '../lib/project-fetcher-hoc.jsx';
import TitledHOC from '../lib/titled-hoc.jsx';
import ProjectSaverHOC from '../lib/project-saver-hoc.jsx';
import storage from '../lib/storage';
import vmListenerHOC from '../lib/vm-listener-hoc.jsx';
import vmManagerHOC from '../lib/vm-manager-hoc.jsx';
import cloudManagerHOC from '../lib/cloud-manager-hoc.jsx';
import TWFullScreenResizerHOC from '../lib/tw-fullscreen-resizer-hoc.jsx';

import GUIComponent from '../components/gui/gui.jsx';
import { setIsScratchDesktop } from '../lib/isScratchDesktop.js';

class GUI extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loginData: {},
            showModal: true
        };

        // Listen for login data from external source
        window.addEventListener('message', (event) => {
            if (event.origin !== 'https://www.snail-ide.com') return;
            this.setState({ loginData: event.data });
            console.log(event.data);
        });
    }

    componentDidMount() {
        setIsScratchDesktop(this.props.isScratchDesktop);
        this.props.onStorageInit(storage);
        this.props.onVmInit(this.props.vm);

        // Set ReactModal app element to avoid accessibility warnings
        ReactModal.setAppElement('body');
    }

    componentDidUpdate(prevProps) {
        if (this.props.projectId !== prevProps.projectId && this.props.projectId !== null) {
            this.props.onUpdateProjectId(this.props.projectId);
        }
        if (this.props.isShowingProject && !prevProps.isShowingProject) {
            this.props.onProjectLoaded();
        }
    }

    render() {
        if (this.props.isError) {
            throw new Error(
                `Error in GUI [location=${window.location}]: ${this.props.error?.stack || this.props.error}`
            );
        }

        const {
            children,
            fetchingProject,
            isLoading,
            loadingStateVisible,
            isPlayground,
            ...componentProps
        } = this.props;

        return (
            <>
                <GUIComponent
                    loading={fetchingProject || isLoading || loadingStateVisible}
                    isPlayground={isPlayground}
                    username={this.state.loginData.packet?.username}
                    {...componentProps}
                >
                    {children}
                </GUIComponent>

                {/* Full-screen Welcome Modal */}
                {this.state.showModal && (
                    <Modal
                        contentLabel="Banana-mod"
                        onRequestClose={() => this.setState({ showModal: false })}
                        style={{
                            overlay: {
                                position: "fixed",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: "rgba(0, 0, 0, 0.5)", // subtle dark overlay
                                zIndex: 9999,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center"
                            },
                            content: {
                                position: "relative",
                                inset: "unset",
                                padding: "40px",
                                width: "90%",
                                maxWidth: "700px",
                                backgroundColor: "#ffffff", // fully white background
                                borderRadius: "12px",
                                boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                                textAlign: "center",
                                overflow: "auto",
                                maxHeight: "90vh"
                            }
                        }}
                    >
                        <div>
                            <h1 style={{ marginBottom: '10px' }}>Welcome to Banana-mod!</h1>
                            <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>HAPPY CHRISTMAS</p>
                            <hr style={{ borderColor: "yellow", borderWidth: "2px", width: "100%", margin: "20px 0" }} />
                            <p>This is a mod of Snail-IDE that is a mod of PenguinMod that is a mod of Turbowarp which is a mod of Scratch.</p>
                            <p>Banana-mod adds stuff like:</p>
                            <ul style={{ textAlign: 'left', margin: '10px 0' }}>
                                <li>Extra Extensions</li>
                                <li>Extra Features</li>
                                <li>And Much More!</li>
                                <li>AND BANANAS!!!</li>
                            </ul>
                            <i>Enjoy programming! 🍌</i>
                        </div>
                    </Modal>
                )}
            </>
        );
    }
}

GUI.propTypes = {
    children: PropTypes.node,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    fetchingProject: PropTypes.bool,
    intl: intlShape,
    isError: PropTypes.bool,
    isScratchDesktop: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    isLoading: PropTypes.bool,
    isPlayground: PropTypes.bool,
    loadingStateVisible: PropTypes.bool,
    onProjectLoaded: PropTypes.func,
    onStorageInit: PropTypes.func,
    onUpdateProjectId: PropTypes.func,
    onVmInit: PropTypes.func,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    vm: PropTypes.instanceOf(VM).isRequired,
    username: PropTypes.string
};

GUI.defaultProps = {
    isScratchDesktop: false,
    isPlayground: false,
    onStorageInit: storageInstance => storageInstance.addOfficialScratchWebStores(),
    onProjectLoaded: () => {},
    onUpdateProjectId: () => {},
    onVmInit: () => {}
};

const mapStateToProps = state => {
    const loadingState = state.scratchGui.projectState.loadingState;
    return {
        activeTabIndex: state.scratchGui.editorTab.activeTabIndex,
        error: state.scratchGui.projectState.error,
        isError: getIsError(loadingState),
        isScratchDesktop: state.scratchGui.mode.isScratchDesktop,
        isShowingProject: getIsShowingProject(loadingState),
        projectId: state.scratchGui.projectState.projectId,
        vm: state.scratchGui.vm
    };
};

const mapDispatchToProps = dispatch => ({
    onRequestCloseCostumeLibrary: () => dispatch(closeCostumeLibrary()),
    onRequestCloseBackdropLibrary: () => dispatch(closeBackdropLibrary()),
    onRequestCloseTelemetryModal: () => dispatch(closeTelemetryModal()),
    onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
    onActivateTab: tab => dispatch(activateTab(tab)),
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    onActivateSoundsTab: () => dispatch(activateTab(SOUNDS_TAB_INDEX))
});

const ConnectedGUI = injectIntl(connect(mapStateToProps, mapDispatchToProps)(GUI));

const WrappedGui = compose(
    LocalizationHOC,
    ErrorBoundaryHOC('Top Level App'),
    FontLoaderHOC,
    ProjectFetcherHOC,
    TitledHOC,
    ProjectSaverHOC,
    vmListenerHOC,
    vmManagerHOC,
    SBFileUploaderHOC,
    cloudManagerHOC,
    TWFullScreenResizerHOC
)(ConnectedGUI);

export default WrappedGui;
