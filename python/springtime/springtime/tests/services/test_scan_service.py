import pytest

from springtime.models.open_ai import OpenAIModel
from springtime.services.scan_service import OpenAIScanService, ScanService


@pytest.fixture()
def scan_service():
    return OpenAIScanService(OpenAIModel.gpt3_16k)


DUMMY_TEXT = """Ladies and Gentlemen:
We refer to the proposed $85,000,000 Revolving Credit Facility and $375,000,000 Term Loan B
(collectively, the "Credit Facilities" and each, a “Facility”) for NPC International, Inc. (the "Company") that
you are arranging at our request, and the Confidential Information Memorandum (Unrestricted) forwarded
herewith (the "Confidential Information Memorandum"). We have reviewed or participated in preparing
the Confidential Information Memorandum and the information contained therein.
The Company has reviewed the information contained in the Confidential Information Memorandum and
represents and warrants that the information contained in the Confidential Information Memorandum,
taken as a whole together with the Company`s public filings, does not contain any untrue statement of a
material fact or omit to state a material fact necessary in order to make the statements contained therein,
in light of the circumstances under which they were made, not materially misleading. Any management
projections or forward-looking statements included in the Confidential Information Memorandum are
based on assumptions and estimates developed by management of the Company in good faith and
management believes such assumption and estimates to be reasonable as of the date of the Confidential
Information Memorandum. Whether or not such projections or forward looking statements are in fact
achieved will depend upon future events some of which are not within the control of the Company.
Accordingly, actual results may vary from the projections and such variations may be material. The
projections included in the Confidential Information Memorandum should not be regarded as a
representation by the Company or its management that the projected results will be achieved.
The Company represents and warrants that the information contained in the Confidential Information
Memorandum is either publicly available information or not material information (although it may be
sensitive and proprietary) with respect to the Company, its subsidiaries, its affiliates or their respective
securities for purposes of United States federal and state securities laws.
We request that you distribute the Confidential Information Memorandum to such financial institutions as
you may deem appropriate to include in the Facilities. We agree that we will rely on, and that you are
authorized to rely on, the undertakings, acknowledgments and agreements contained in the Notice to and
Undertaking by Recipients accompanying the Confidential Information Memorandum or otherwise
acknowledged by recipients in connection with the Confidential Information Memorandum
"""


def test_scan(scan_service: ScanService):
    output = scan_service.scan(
        file_name="Pizza-Hut-CIM.pdf",
        text=DUMMY_TEXT,
    )

    assert output.description
    breakpoint()
