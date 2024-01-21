# Copyright 2019-2022 The ASReview Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# deprecated in __init__.py, use asreview.models.feature_extraction instead
from asreview.data.base import Dataset
from asreview.data.loader import load_dataset
from asreview.io.utils import list_readers
from asreview.io.utils import list_writers
from asreview.project import ASReviewProject
from asreview.project import open_state
from asreview.utils import asreview_path
from asreview.utils import get_data_home

# NOQA
from ._version import get_versions

__version__ = get_versions()["version"]
del get_versions

__all__ = [
    "load_dataset",
    "asreview_path",
    "Dataset",
    "ASReviewProject",
    "get_data_home",
    "list_readers",
    "list_writers",
    "open_state",
]
