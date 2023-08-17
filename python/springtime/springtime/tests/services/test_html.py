from springtime.services.html import parse_citations

HTML = """<p>The CIM-05-Arion-Banki-hf.pdf file provides information on the restrictions on the sale and transfer of the Bonds. According to the information memorandum, the Bonds may not be offered, sold, or delivered to any person located or resident in any jurisdiction where such actions are unlawful without further measures being taken. The Bonds have not been and will not be registered under the Securities Act, and therefore may not be offered or sold within the United States, or to, or for the account or benefit of, U.S. persons, except pursuant to an applicable exemption from, or in a transaction not subject to, the registration requirements of the Securities Act. The Bonds are being offered and sold only outside the United States to non-U.S. purchasers in reliance upon Regulation S, and in the United States to qualified institutional buyers (QIBs) in reliance on an exemption from the registration requirements of the Securities Act [citation|CIM-05-Arion-Banki-hf.pdf,1-2].</p>
"""


def test_parse_citations():
    output = parse_citations(HTML, "hi")
    breakpoint()
