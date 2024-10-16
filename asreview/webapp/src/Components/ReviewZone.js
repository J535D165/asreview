import React, { useState, useEffect } from 'react'

import { makeStyles } from '@material-ui/core/styles'
import {
  Box,
  Link,
} from '@material-ui/core'
import { Alert, AlertTitle } from '@material-ui/lab'

import ReviewDrawer from './ReviewDrawer'
import ArticlePanel from './ArticlePanel'
import DecisionBar from './DecisionBar'
import DecisionUndoBar from './DecisionUndoBar'
import { useKeyPress } from '../hooks/useKeyPress'

import { connect } from "react-redux";

import axios from 'axios'
import { api_url, reviewDrawerWidth } from '../globals.js';

// redux config
import { toggleReviewDrawer } from '../redux/actions'


const useStyles = makeStyles({
  box: {
    paddingBottom: 30,
    overflowY: 'auto',
  },
  alertFullWidth: {
    width: '100%',
    overflowY: 'auto',
  },
  alertWithDrawer: {
    width: '100%',
    overflowY: 'auto',
    paddingRight: reviewDrawerWidth,
  },
  link: {
    paddingLeft: "3px",
  },
});


const mapStateToProps = state => {
  return {
    project_id: state.project_id,
    reviewDrawerOpen: state.reviewDrawerOpen,
  };
};


function mapDispatchToProps(dispatch) {
    return({
        toggleReviewDrawer: () => {dispatch(toggleReviewDrawer())}
    })
}


const ReviewZone = (props) => {
  const classes = useStyles();

  const [undoState, setUndoState] = useState({
    'open': false,
    'message': null,
  })

  const [recordState, setRecordState] = useState({
    'isloaded': false,
    'record': null,
    'selection': null,
 })

  const [previousRecordState, setPreviousRecordState] = useState({
      'record': null,
      'decision': null,
  })

  const [statistics, setStatistics] = useState({
    "name": null,
    "authors": null,
    "decsription": null,
    "n_included": null,
    "n_excluded": null,
    "n_since_last_inclusion": null,
    "n_papers": null,
    "n_pool": null,
  });

  const [history, setHistory] = useState([]);

  const relevantPress = useKeyPress("r");
  const irrelevantPress = useKeyPress("i");
  const undoPress = useKeyPress("u");

  const storeRecordState = (label) => {
    setPreviousRecordState({
      'record': recordState.record,
      'decision': label,
    })
  }

  const resetPreviousRecordState = () => {
    setPreviousRecordState({
      'record': null,
      'decision': null,
    });
  }

  const loadPreviousRecordState = () => {
    setRecordState({
      'isloaded': true,
      'record': previousRecordState.record,
      'selection': previousRecordState.decision,
    });
}

  const startLoadingNewDocument = () => {
    setRecordState({
      'isloaded': false,
      'record': null,
      'selection': null,
    });
  }

  const showUndoBarIfNeeded = (label, initial) => {
    if (props.undoEnabled) {
      const mark = label === 0 ? "irrelevant" : "relevant"
      const message = `${initial ? 'Marked as' : 'Converted to'} ${mark}`
      showUndoBar(message)
    }
  }

  const showUndoBar = (message) => {
    setUndoState({
      'open': true,
      'message': message,
    })
  }

  const closeUndoBar = () => {
    setUndoState({
      'open': false,
      'message': null,
    })
  }

  const isUndoModeActive = () => {
    return recordState.record.doc_id === previousRecordState['record']?.doc_id
  }

  const needsClassification = (label) => {
    if (!isUndoModeActive()) {
        return true
    }
    return label !== previousRecordState.decision
  }

  const skipClassification = () => {
    resetPreviousRecordState()
    startLoadingNewDocument()
  }

  const makeDecision = (label) => {
    closeUndoBar() // hide potentially active undo bar
    if (!needsClassification(label)) {
      skipClassification()
    } else {
      classifyInstance(label, !isUndoModeActive());
    }
    storeRecordState(label)
  }

  const undoDecision = () => {
    closeUndoBar()
    loadPreviousRecordState()
  }

  /**
   * Include (accept) or exclude (reject) current article
   *
   * @param label  1=include, 0=exclude
   * @param initial   true=initial classification, false=update previous classification
   */
  const classifyInstance = (label, initial) => {

    const url = api_url + `project/${props.project_id}/record/${recordState['record'].doc_id}`;

    // set up the form
    let body = new FormData();
    body.set('doc_id', recordState['record'].doc_id);
    body.set('label', label);

    return axios({
      method: initial ? 'post' : 'put',
      url: url,
      data: body,
      headers: { 'Content-Type': 'application/json' }
    })
    .then((response) => {
      console.log(`${props.project_id} - add item ${recordState['record'].doc_id} to ${label?"inclusions":"exclusions"}`);
      startLoadingNewDocument()
      showUndoBarIfNeeded(label, initial);
    })
    .catch((error) => {
      console.log(error);
    });
  }

  useEffect(() => {

    /**
     * Get summary statistics
     */
    const getProgressInfo = () => {

      const url = api_url + `project/${props.project_id}/progress`;

      return axios.get(url)
        .then((result) => {
            setStatistics(result.data)
        })
        .catch((err) => {
            console.log(err)
        })
    }

    const getProgressHistory = () => {

      const url = api_url + `project/${props.project_id}/progress_history`;

      return axios.get(url)
        .then((result) => {
          setHistory(result.data)
        })
        .catch((err) => {
          console.log(err)
        })
    }

    /**
     * Get next article
     */
    const getDocument = () => {

      const url = api_url + `project/${props.project_id}/get_document`;

      return axios.get(url)
      .then((result) => {

        /* Check for last paper */
        if (result.data["pool_empty"]){
          props.handleAppState('review-complete');
        } else {

          /* New article found and set */
          setRecordState({
            'record':result.data["result"],
            'isloaded': true,
            'selection': null,
          });
        }

      })
      .catch((error) => {
        console.log(error);
      });
    }

    if (!recordState['isloaded']) {

      getProgressInfo();

      getProgressHistory();

      getDocument();
    }
  },[props.project_id, recordState, props]);

  useEffect(() => {

    /**
     * Use keyboard shortcut
     */
    if (props.keyPressEnabled) {

      if (relevantPress && recordState.isloaded) {
        makeDecision(1);
      }
      if (irrelevantPress && recordState.isloaded) {
        makeDecision(0);
      }
      if (undoPress && undoState.open && props.undoEnabled) {
        undoDecision();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relevantPress, irrelevantPress, undoPress]);

  return (
    <Box
      className={classes.box}
    >
      
      {/* Alert Exploration Mode */}
      {recordState.record !== null && recordState.record._debug_label !== null  &&
        <div className={props.reviewDrawerOpen ? classes.alertWithDrawer : classes.alertFullWidth}>
          <Alert severity="warning">
            <AlertTitle>You are screening through a manually pre-labeled dataset</AlertTitle>
            <div>
              Relevant documents are displayed in green. Read more about
              <Link
                className={classes.link}
                href="https://asreview.readthedocs.io/en/latest/user_testing_algorithms.html#exploration-mode"
                target="_blank"
              >
                <strong>Exploration Mode</strong>
              </Link>.
            </div>
          </Alert>
        </div>
      }

      {/* Article panel */}
      {recordState['isloaded'] &&
        <ArticlePanel
          record={recordState['record']}
          reviewDrawerState={props.reviewDrawerOpen}
          showAuthors={props.showAuthors}
          textSize={props.textSize}
        />
      }

    {/* Decision bar */}
      <DecisionBar
        reviewDrawerState={props.reviewDrawerOpen}
        makeDecision={makeDecision}
        block={!recordState['isloaded']}
        recordState={recordState}
      />

    {/* Decision undo bar */}
    <DecisionUndoBar
        state={undoState}
        undo={undoDecision}
        close={closeUndoBar}
      />

    {/* Statistics drawer */}
      <ReviewDrawer
        state={props.reviewDrawerOpen}
        handle={props.toggleReviewDrawer}
        statistics={statistics}
        history={history}
      />

    </Box>
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReviewZone);
