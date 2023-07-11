import pytest

from springtime.services.anthropic_client import AnthropicClient
from springtime.services.long_form_report_service import (
    ClaudeLongformReportService,
    LongformReportService,
)


@pytest.fixture
def anthropic_client():
    return AnthropicClient()


@pytest.fixture
def long_form_report_service(anthropic_client: AnthropicClient):
    return ClaudeLongformReportService(anthropic_client)


DATA = """
Book Number ____________________________

Issued To ____________________________









Confidential Information Memorandum


February 2007






Bear, Stearns & Co. Inc. 10177937, v1 CONFIDENTIAL i





This Confidential Information Memorandum (the “Memorandum”) has been prepared by Bear,
Stearns & Co. Inc. (“Bear Stearns”) solely for informational purposes from materials supplied to
Bear Stearns by American Casino and Entertainment Properties LLC (“ACEP” or the “Company”).
This Memorandum relates to the possible sale of the Company.  This Memorandum is being
furnished through Bear Stearns as the Company’s exclusive financial advisor, solely for use by
prospective purchasers in considering an acquisition of the Company.

This Memorandum has been prepared to assist interested parties in making their own evaluation of
ACEP and does not purport to contain all of the information that a prospective purchaser may
desire.  In all cases, interested parties should conduct their own investigation and analysis of ACEP
and the data set forth in this Memorandum.

Bear Stearns has not independently verified the accuracy and completeness of any of the
information, contained in this Memorandum.  Neither Bear Stearns, the Company or its subsidiaries,
nor their respective affiliates, directors, officers, employees, representatives or agents makes any
representation or warranty as to the accuracy or completeness of this Memorandum, or any
supplemental information furnished in connection herewith, and none of the foregoing shall have
any liability for any representations (express or implied) contained in, or for any omissions from,
this Memorandum, any supplemental information furnished in connection herewith or any other
written or oral communication transmitted to the recipient in the course of the recipient’s evaluation
of ACEP.

Neither Bear Stearns, the Company or its subsidiaries, nor their respective affiliates, directors,
officers, employees, representatives or agents, undertakes any obligation to provide additional
information or to correct or update any of the information set forth in this Memorandum.

By accepting this Memorandum, the recipient acknowledges and agrees that all information
contained herein and all other information provided by Bear Stearns, or the Company related thereto
is subject to the terms of the confidentiality agreement previously executed by the recipient
regarding this Memorandum.  Without limiting the generality of the foregoing, (i) the recipient will
not reproduce this Memorandum, or such other information, in whole or in part, and will use this
Memorandum and such other information solely for purposes of evaluating the recipient’s interest in
acquiring ACEP and (ii) if the recipient does not wish to pursue this matter, the recipient will
promptly return this Memorandum and such other information, if any, to Bear Stearns, together with
any other materials relating to ACEP which the recipient may have received from either Bear
Stearns, ACEP, the Company or its subsidiaries, or their respective affiliates, directors, officers,
employees, representatives or agents, as well as any notes or written materials prepared by the
recipient.

ACEP reserves the right to negotiate with one or more prospective buyers at any time and to enter
into a definitive agreement for the sale of ACEP or any components thereof without prior notice to
the recipient of this Memorandum or other prospective purchasers.

ACEP also reserves the right to terminate, at any time, solicitation of indications of interest for the
acquisition of ACEP or the further participation in the investigation and proposal process by any
party.  Finally, ACEP reserves the right to modify, at any time, any procedures relating to such
process without assigning any reason thereto.  The Company intends to conduct business in the
ordinary manner during the evaluation period; however, ACEP reserves the right to take any action,
whether or not in the ordinary course of business, including but not limited to the sale of any assets
of the Company, which it deems necessary or prudent in the conduct of such business.






Bear, Stearns & Co. Inc. 10177937, v1 CONFIDENTIAL





Table of Contents

Section

1 Executive Summary

2 Investment Considerations

3 Business History and Description

 A Stratosphere

 B Arizona Charlie’s Decatur

 C Arizona Charlie’s Boulder

 D Aquarius

4 Financial Review

5 Management

6 Process Considerations














Section 1
Executive Summary






Bear, Stearns & Co. Inc.  CONFIDENTIAL 1





Executive Summary
American Casino and Entertainment Properties LLC (“ACEP” or the “Company”), a wholly-owned
indirect subsidiary of American Real Estate Partners, L.P. (“AREP”) (NYSE:  ACP), currently owns
and operates four distinct gaming and entertainment properties in Nevada, one of the most favorable
and stable gaming markets in the world.

 Stratosphere Casino Hotel & Tower.  One of the most recognized landmarks on the Las
Vegas Strip, the “Must See” resort caters to visitors to Las Vegas.

 Arizona Charlie’s Decatur and Arizona Charlie’s Boulder.  Well-known casinos in their
respective marketplaces, the properties are located off-Strip and cater primarily to residents of
the fast growing Las Vegas metropolitan market.

 Aquarius Casino Resort.  The largest hotel in the Laughlin market with more than 1,900
rooms, the property (formerly known as the Flamingo Laughlin Hotel and Casino) caters to
visitors from Southern California and Arizona and locals from Laughlin, Nevada.

Overall, each property offers customers a value-oriented experience by providing quality hotel
accommodations, competitive odds in the casinos and a variety of dining facilities.  Furthermore,
the Stratosphere and Aquarius offer value-oriented, well-regarded entertainment attractions and
amenities.

Notably, all of the Company’s properties have recently undergone extensive capital improvement
programs and are well positioned within their respective markets to benefit from these significant
investments.

The following table further summarizes the Company’s properties:

Property Summary ($ in millions)
  Completion EBITDA
  Date of After Gaming    2006E PF(2)
 Date Recent First Full Square Slot Table Hotel Net

Property Acquired Renovation Yr of Ops Footage(1) Machines(1) Games(1) Rooms(1) Revenue EBITDA
Stratosphere 1998 March ’07 $13.6  80,000  1,309  49  2,444  $197.6  $42.3

Arizona Charlie’s Decatur 1999 January ’07  3.2  52,000  1,379  15  258  82.5  29.1

Arizona Charlie’s Boulder(3) 2000 June ’06  (6.0)  47,000  1,061  16  303  48.0  11.0

Aquarius(4) 2006 October ’06 NA  57,000  1,021  42  1,907  101.6  9.0

Total     236,000  4,770  122  4,912  $429.7  $91.5

(1) At December 31, 2006, except Aquarius at September 30, 2006.
(2) Pro forma for a full year of Laughlin operating results.
(3) Opened in 1988 as a standalone hotel and RV park.
(4) Hotel room renovation will continue through 2008.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 2





Summary Financial Information
From 2001 to 2005, consolidated net revenue and EBITDA grew at a compounded annual growth
rate of 7.8% and 33.6%, respectively, with revenues increasing from $242.5 million to $328.0
million and EBITDA increasing from $28.1 million to $89.4 million.

Historical Net Revenue ($ in millions)  Historical EBITDA ($ in millions)

7.8% CAGR ‘01–‘05

$242.5 $250.0 $262.8
$300.0

$328.0

0

100

200

300

400

$500

2001 2002 2003 2004 2005
0

100

200

300

400

$500

(1)

33.6% CAGR ‘01–‘05
$72.4

$44.1
$31.3$28.1

$89.4

0

20

40

60

80

$100

2001 2002 2003 2004 2005
0

20

40

60

80

$100

(1)


 % Margin 11.6% 12.5% 16.8% 24.1% 27.3%


(1) Stratosphere completed a 1,000 room hotel room expansion in June 2001.

Beginning in 2005 and continuing throughout 2006, the Company embarked upon a comprehensive
capital improvement program, aimed at enhancing the position of each property in its respective
market.  As a result of this initiative, the properties experienced temporary construction disruptions,
which, in conjunction with a modest softening in the Las Vegas market overall, led to a modest
decline in operating performance in 2006.

Virtually all of the Company’s capital improvement programs are now complete, and management
believes each of the properties are now poised to capitalize on these improvements going forward.

Protected Net Revenue ($ in millions)  Projected EBITDA ($ in millions)

4.9% CAGR ‘06E PF–‘08E

$429.7 $450.9 $472.8

0

100

200

300

400

500

600

$700

2006E PF 2007E 2008E
0

100

200

300

400

500

600

$700

(2)

11.1% CAGR ‘06E PF–‘08E

$91.5
$106.5 $112.9

0

25

50

75

100

125

$150

2006E PF 2007E 2008E
0

25

50

75

100

125

$150

(2)


 % Margin 21.3% 23.6% 23.9%


(2) Pro Forma results include Aquarius.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 3





Summary Financial Information

The Company’s revenues and EBITDA benefit from both geographic and business mix
diversification.

Net Revenue and EBITDA by Property
2006E PF Net Revenue by Property   2006E PF Net EBITDA by Property

Laughlin
23.6%

Boulder
11.2%

Decatur
19.2%

Stratosphere
46.0%



 Laughlin
9.9%

Boulder
12.0%

Decatur
31.8%

Stratosphere
46.3%


Net Revenue:  $429.7 Million  EBITDA:  $91.5 Million

Gross Revenue Breakdown by Segment
2006E PF Gross Revenue by Segment   2006E PF Gross Revenue by Sub-Segment

Gaming
53.9%

Non-Gaming
46.1%





Rooms
18.0%

Other
Gaming

2.4%
Tables
7.9%

Slots
43.6%

Food
15.2%

Beverage
4.6%

Retail
2.3%

Other
2.8%Tower

3.2%


Gross Revenue:  $465.6 Million  Gross Revenue:  $465.6 Million





Note: Pro Forma results include Aquarius.














Section 2
Investment Considerations






Bear, Stearns & Co. Inc.  CONFIDENTIAL 4





Investment Considerations
 Strategically located, diversified portfolio of casino assets in the most stable
gaming regulatory jurisdiction in the world, in one of the fastest growing
gaming markets in the US.

 Las Vegas assets are well-positioned to cater to both Tourists and the Locals
Market.

 Compelling development opportunity on the Las Vegas Strip on
approximately 17 acres of land located adjacent to the Stratosphere.

 A recently completed approximately $50 million capital improvement
program has positioned all four properties for renewed growth in their
respective markets.

 Unique opportunity to exploit the growing Laughlin market, with the
recently acquired and newly repositioned Aquarius Resort & Casino
(formerly the Flamingo Laughlin), the largest hotel in Laughlin with 1,907
hotel rooms.

 Emphasis on slot play, in conjunction with relatively low maintenance
capital expenditures, produces strong, predictable free cash flow.

 Well-regarded, experienced management team, with a demonstrated track
record for turning around neglected assets.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 5





Investment Considerations respective
Strategically located, diversified portfolio of casino assets in the most stable gaming regulatory
jurisdiction in the world, in one of the fastest growing gaming markets in the US.

ACEP’s properties operate in four distinct markets that serve different segments of the overall
gaming market.

•  The Stratosphere caters to visitors to the Las Vegas Strip.
•  Arizona Charlie’s Boulder and Decatur properties cater to local residents/visitors to the Boulder Strip

and its respective surrounding communities, and to local residents of North and West Las Vegas and
its respective surrounding communities, respectively.

•  Aquarius Casino Resort caters to visitors from Southern California and Arizona and locals from
Laughlin, Nevada.


Arizona Charlie’s
Decatur

Stratosphere

Arizona Charlie’s
Boulder

Arizona Charlie’s
Decatur

Stratosphere

Arizona Charlie’s
Boulder

Arizona Charlie’s
Decatur

Stratosphere

Arizona Charlie’s
Boulder






im0 5.0 1 5.1 2 5.2

0 250
miles

500

Laughlin, NV

Las Vegas, NV

Harrah’s Laughlin

River Palms

Golden Nugget Laughlin

Pioneer

Ramada Express Colorado Belle

Edgewater

Don Laughlin’s Riverside

Aquarius

Avi Resort

0 250
miles

500

Laughlin, NV

Las Vegas, NV

Harrah’s Laughlin

River Palms

Golden Nugget Laughlin

Pioneer

Ramada Express Colorado Belle

Edgewater

Don Laughlin’s Riverside

Aquarius

Avi Resort

im0 5.0 1 5.1 2 5.2

0 250
miles

500

Laughlin, NV

Las Vegas, NV

Harrah’s Laughlin

River Palms

Golden Nugget Laughlin

Pioneer

Ramada Express Colorado Belle

Edgewater

Don Laughlin’s Riverside

Aquarius

Avi Resort

0 250
miles

500

Laughlin, NV

Las Vegas, NV

Harrah’s Laughlin

River Palms

Golden Nugget Laughlin

Pioneer

Ramada Express Colorado Belle

Edgewater

Don Laughlin’s Riverside

Aquarius

Avi Resort








Bear, Stearns & Co. Inc.  CONFIDENTIAL 6





Investment Considerations

Las Vegas assets are well-positioned to cater to both Tourists and the Locals Market.

 The Stratosphere is one of the most recognized and most visited tourist attractions on the Strip.

 The Arizona Charlie’s properties are recognized as successful proven locals casinos.

The Las Vegas Market

 Visitation to Las Vegas has increased from 29.0 million in 1995 to 38.6 million in 2005, a
CAGR of 2.9%.

 Occupancy in Las Vegas has increased in recent years to almost 90%.

•  The market has shown a remarkable resiliency to economic downturns and political events.

 Las Vegas has been the US’ top-ranked destination for trade shows for the last ten years.

•  Trade show attendees increased from 2.9 million in 1995 to 6.2 million in 2005, a CAGR of 7.7%.

•  Trade show attendees spent approximately $7.6 billion in 2005.

Historical Visitation to Las Vegas  Las Vegas Room Supply and Occupancy

’01–’05 CAGR:  2.5%

35 35 36
37 39

0

10

20

30

40

50

2001 2002 2003 2004 2005

V
is

ito
rs

 (i
n

m
ill

io
ns

)

0

10

20

30

40

50

V
isitors (in m

illions)



’01–’05 CAGR:  1.3%

127 127 130 132 133

89%
89%

85%

84%
85%

0

30

60

90

120

150

180

2001 2002 2003 2004 2005

R
oo

m
 S

up
pl

y
(in

 th
ou

sa
nd

s)

83

85

87

89

91

93

95%

O
ccupancy R

ate

Room Supply   Occupancy Rate
Source:  Las Vegas Convention and Visitors Authority.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 7





Investment Considerations

Local Market

ACEP’s properties are well positioned to benefit from the growth in the local population.

 Nevada has been the fastest-growing state in the United States for the last 19 years, according to
the Las Vegas Convention and Visitation Authority.

 Clark County population has grown between 1995 and 2005 at a much more aggressive pace
than the overall United States to include 1.8 million residents at the end of 2005.
•  Clark County, Nevada population growth, 5.5% CAGR.

•  Overall US population growth, 1.1% CAGR.

 Clark County has enjoyed a very strong economy and positive growing demographic including
an increasing number of retirees and other active gaming patrons.
•  2004 Clark County median household income was $44,821.

•  2004 National median household income was $44,684.

Fastest Growing Cities in the US

11.6% 11.4% 11.0% 10.9%

9.2%

7.3%
6.4%

5.2% 4.9%

0

2

4

6

8

10

12

14%

Elk Grove,
CA

North
Las Vegas

Port St. Lucie,
FL

Gilbert,
AZ

Cape Coral,
FL

Moreno Valley,
CA

Rancho
Cucamonga,

CA

Miramar,
FL

Chandler,
AZ

%
 G

ro
w

th

0

2

4

6

8

10

12

14%

%
 G

row
th

Note:  Represents the period of 7/1/04-7/1/05.
Source:  U.S. Census Bureau.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 8





Investment Considerations
Compelling development opportunity on the Las Vegas Strip on approximately 17 acres of land
located adjacent to the Stratosphere.

Stratosphere

 The Stratosphere’s close proximity to the Las Vegas Convention Center provides a compelling
development opportunity on the Las Vegas Strip.
•  1.3 miles from the Las Vegas Convention Center.

•  22,154 conventions held in 2005.

•  Trade show attendees increased from 2.9 million in 1995 to 6.2 million in 2005, a CAGR of 7.7%.

•  Trade show attendees spent approximately $7.6 billion in 2005.

•  Convention attendance accounted for 13.8 million hotel night stays in 2005.

 Management is currently considering the development of a 1,000-room hotel expansion and/or
the development of additional convention center space on the adjacent 17 acres.



New Frontier

Stardust
Las Vegas Hilton

Circus Circus Riviera

Sahara
Stratosphere

Excalibur








Bear, Stearns & Co. Inc.  CONFIDENTIAL 9





Investment Considerations

A recently completed approximately $50 million capital improvement program has positioned all
four properties for renewed growth in their respective markets.

Stratosphere

 Having recently completed the renovation of all of the original 1,444 hotel rooms, the
Stratosphere now boasts the newest room offerings north of Wynn Las Vegas.

 The Stratosphere’s newly renovated room product is poised to capture an even greater share of
its targeted customer base, as the supply of affordable hotel accommodations continues to
shrink.
•  No new comparable room product is scheduled to come online in the Stratosphere’s core market until

at least 2010.

•  The luxury room product expected to come online over the next 2 to 3 years (e.g. Wynn’s Encore,
MGM’s CityCenter, etc.) will likely provide the Stratosphere with a “pricing umbrella” under which
the Stratosphere will be able to continue to capture a greater than fair share of value-oriented
customers who demand quality, affordable accommodations.

 The property boasts approximately 112,000 square feet of undeveloped retail space and 17 acres
of undeveloped land, which provides potential for a convention center and/or up to 1,000
additional rooms.

 Transitioned entire slot floor to Ticket-In/Ticket-Out (“TITO”) slot machines.

 Several other recently completed initiatives include:
•  Newly refurbished Top of the World restaurant, Romance lounge, entrance and lobby areas;

•  Two new thrill rides;

•  Redesigned wedding chapels;

•  New nightclub, “Polly Esters”; and

•  Casino floor improvements, including:
−  New carpet and wall covering;
−  New Center bar;
−  New High Limit Slots;
−  New VIP Check-In.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 10





Investment Considerations
Arizona Charlie’s Decatur

 Management has invested approximately $38 million to improve the Decatur property:
•  Converted 100% of slot machines from coin operated to “TITO” technology;

•  Redesigned casino floor;

•  Opened an Outback Steakhouse on the first floor of the casino;

•  Introduced a revitalized tiered player rewards program.

Arizona Charlie’s Boulder

 Completed an $8.1 million casino expansion, in June 2006, which included:
•  7,300 square feet of new gaming space;

•  235 new slot machines.

 Converted 100% of slot machines to “TITO” technology.

 Renovated all hotel rooms.

 Re-launched a revitalized tiered player rewards program.

Aquarius

 Implemented a $40 million capital expenditure program, following the closing of the acquisition
of the Aquarius, formerly the Flamingo Laughlin Hotel and Casino, in May 2006.
•  New slot floor in Laughlin with enhanced new gaming systems and “TITO” technology.

−  1,000 new slot machines.

•  Re-branding of property as “Aquarius”.

•  New front lobby.

•  Hotel room refurbishment.

•  Enhancement of player amenities:
−  New High-Limit area;
−  New VIP Check-In;
−  New VIP Lounge;
−  Refurbished Center Bar.

•  Enhancement of marketing programs to attract walk-in traffic from nearby outdoor River Walk.
−  New outdoor River Walk patio lounge.

•  Development of new nationally branded food & beverage options.
−  Starbucks® coffee outlet.
−  Outback Steakhouse.

•  Enhancement of entertainment options.
−  Extensive showroom and lounge renovation.

 While the extensive renovation of the property resulted in a fair amount of disruption in 2006,
the renovation is largely complete and the property is poised for renewed growth in 2007.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 11





Investment Considerations

Unique opportunity to exploit the growing Laughlin market, with the recently acquired and newly
repositioned Aquarius Resort & Casino (formerly the Flamingo Laughlin), the largest hotel in
Laughlin with 1,907 hotel rooms.

The Laughlin Market

The Laughlin gaming market targets tourists and visitors from Southern California and Arizona  and
locals from Laughlin, Nevada.

 The Laughlin gaming market grew 7.6% and 4.3% in 2004 and 2005, respectively, as the market
stabilized from the opening of tribal casinos in California.

 The market is expected to continue to create stable revenue growth as:
•  Limited new gaming supply is expected from California Native American casinos;

•  Local residential development is anticipated to nearly double the surrounding customer base;

•  Laughlin is a value-orientated destination market that offers an alternative to the fast-pace and higher
costs of Las Vegas with a broad array of attractions including the Colorado River.

 Historically, the Aquarius, operated as the Flamingo Laughlin and owned by Caesars
Entertainment and subsequently Harrah’s Entertainment, was one of the leading properties in the
market.
•  Consistently generated EBITDA of more than $20 million throughout the 1990’s.

 More recently, however, the Aquarius has experienced a weakness in operating results given the
transition in ownership, related property management turnover and a lack of maintenance capital
expenditures.

 Since acquisition by ACEP in 2005, the Company has implemented a significant capital
investment program of $40 million.  Upon completion in 2007, the Aquarius will offer:
•  Renewed managerial focus;

•  Newest slot product in the market;
−  1,000 new state of the art slot machines.

•  Newest room product in the market;

•  Introduction of new food & beverage options;

•  Revamped entertainment program.

 Management believes this investment program will enable the property to recapture its position
of prominence in the market.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 12





Investment Considerations
Emphasis on slot play, in conjunction with relatively low maintenance capital expenditures,
produces strong, predictable free cash flow.

 The Company’s four properties offer over 4,700 slot machines, all of which are ticket – in, ticket
– out (TITO) machines.

 Slot revenues account for over 80% of the Company’s gaming revenues:
•  Stratosphere, 70%;

•  Arizona Charlie’s Decatur, 91%;

•  Arizona Charlie’s Boulder; 91%.

•  Aquarius; 81%

Well-regarded, experienced management team, with a demonstrated track record for turning
around neglected assets.

 ACEP has a seasoned and proven management team with strong expertise in their respective
disciplines.

 The senior management team collectively has over 100 years of operating experience in the
gaming industry.

 The executive and property-level management teams have an established record of developing,
integrating and operating gaming and entertainment properties.

 Management’s continued focus on guest service training for employees has enabled the
properties to consistently exceed customer expectation.

Senior Management

Executive Officer Position

ACEP
Tenure

(In Years)

Richard P. Brown President and CEO, Gaming 7

Denise Barton Senior Vice President, Chief Financial Officer 4

Ronald P. Lurie Executive Vice President and General Manager—Decatur 8

Mark Majetich Senior Vice President and General Manager—Boulder 6

John Lind Senior Vice President and General Manager—Laughlin 1














Section 3
Business History and Description






Bear, Stearns & Co. Inc.  CONFIDENTIAL 13





Business History and Description
American Casino & Entertainment Properties, LLC owns and operates four gaming and
entertainment properties in the Las Vegas metropolitan area.  The four properties are the
Stratosphere Casino Hotel & Tower, which is located on the Las Vegas Strip and caters to visitors
to Las Vegas, two off-Strip casinos, Arizona Charlie’s Decatur and Arizona Charlie’s Boulder,
which cater primarily to residents of Las Vegas and the surrounding communities, and the Aquarius
Casino Resort, formerly known as the Flamingo Laughlin Hotel and Casino, in Laughlin, Nevada,
or the Aquarius, which caters to visitors to Laughlin.

The Stratosphere is one of the most recognized landmarks in Las Vegas, the two Arizona Charlie’s
properties are well-known casinos in their respective marketplaces and the Aquarius has the largest
hotel in Laughlin.

Each of the Company’s properties offers customers a value-oriented experience by providing
competitive odds in their casinos, quality rooms in their hotels, award-winning dining facilities and,
at the Stratosphere, an offering of entertainment attractions found nowhere else in Las Vegas.  The
Company believes the value it offers its patrons, together with a strong focus on customer service,
will enable them to continue to attract customer traffic to their properties.

ACEP is a holding company that was formed in Delaware on December 29, 2003 for the purpose of
acquiring the entities that own and operate the Stratosphere, Arizona Charlie’s Decatur and Arizona
Charlie’s Boulder.  ACEP conducts its operations through direct and indirect wholly-owned
subsidiaries.  These subsidiaries are American Casino & Entertainment Properties Finance Corp.,
Stratosphere Corporation and its wholly-owned subsidiaries, Stratosphere Gaming Corporation,
Stratosphere Land Corporation, Stratosphere Advertising Agency and Stratosphere Leasing, LLC;
and Charlie’s Holding LLC and its wholly-owned subsidiaries, Arizona Charlie’s, LLC and Fresca,
LLC.

On November 29, 2005, AREP Laughlin Corporation entered into an agreement to purchase the
Flamingo Laughlin Hotel and Casino, now known as the Aquarius Casino Resort, or the Aquarius,
in Laughlin, Nevada from Harrah’s Entertainment.  The purchase price was $114.0 million,
including working capital amounts.  The transaction was approved by the Nevada Gaming
Commission upon recommendation of the Nevada Gaming Control Board and closed on May 19,
2006.














Section 3-A
Stratosphere






Bear, Stearns & Co. Inc.  CONFIDENTIAL 14





Stratosphere













Bear, Stearns & Co. Inc.  CONFIDENTIAL 15





Stratosphere
The Stratosphere is situated on approximately 34 acres of land located at the northern end of the Las
Vegas Strip, of which approximately 17 acres is undeveloped land, and the remainder is a tourist-
oriented gaming and entertainment destination property.  The Stratosphere is centered around the
Stratosphere Tower, the tallest free-standing observation tower in the United States and is visible
from all directions, including from McCarran International Airport.

The Stratosphere opened in 1996 at a total cost of approximately $409 million.  ACEP acquired the
property in 1998 and in 2001, completed an approximate $86 million expansion of the Stratosphere,
which included the addition of a 1,000-room hotel tower and a 67,000 square foot pool and
recreation deck.  Since the Company acquired the property in 1998, it has invested a total of
approximately $178 million through December 31, 2006.

Casino

The Stratosphere’s casino contains approximately 80,000 square feet of gaming space, with
approximately 1,309 slot machines on a newly renovated slot floor layout.  In addition to a newly
constructed high-limit slot area, this renovation converted all of the Stratosphere’s video poker and
slot machines to “TITO” technology.  In addition, the Stratosphere has 49 table games, a recently
constructed six table poker room, a renovated race and sports book area and a new VIP check-in
area.

For the years ended December 31, 2006, 2005, 2004 and 2003, approximately 69.5%, 70.7%, 70.6%
and 70.1%, respectively, of the Stratosphere’s gaming revenue was generated by slot machine play.
The Stratosphere derives its other gaming revenue from the poker room and race and sports book,
which primarily are intended to attract customers for slot machines and table games.

Hotel, Food and Beverage

The hotel has 2,444 rooms, including 131 suites.  In 2004 and 2005, ACEP refurbished
approximately 1,400 of its guest rooms.  Additional hotel amenities include a 67,000 square-foot
resort pool and recreation area located on the eighth floor, which includes a café, cocktail bar,
private cabanas and a fitness center.  Beach Club 25, located on the 25th floor, provides a secluded
adult pool.

The Stratosphere offers seven themed restaurants, a newly renovated $1.4 million Center Bar, and
four lounges, two of which feature live entertainment.  The Stratosphere’s premier restaurant is the
recently refurbished Top of the World Restaurant and Lounge, a 336-seat revolving restaurant
located on level 106 in the Tower.  Top of the World has been awarded “Best All-Around
Restaurant” and “Best Romantic Restaurant” by America Online’s City’s Best 2005 and the “Award
of Excellence” in 2004 from Wine Spectator Magazine.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 16





The Tower

The Tower is the tallest freestanding observation tower in the United States and, at 1,149 feet, is the
tallest building west of the Mississippi River.  From the indoor/outdoor observation decks, lounge
and restaurant, Tower visitors have dramatic views of the Las Vegas Strip, downtown Las Vegas
and the surrounding Las Vegas Valley.

The Tower features the three highest thrill rides in the world:

 Big Shot, which catapults up to 16 riders, in harnessed seats, from the 921-foot level of the
Tower, 160 feet straight up the mast of the Tower and allows for a controlled free-fall back to
the landing platform;

 X Scream, which opened in October 2003, is shaped like a giant teeter-totter and launches up to
eight riders approximately 30 feet over the edge of the Tower and then dangles them 900 feet
above the Las Vegas Strip; and

 Insanity, which opened on March 10, 2005, is the final major thrill ride attraction to be built
atop the Tower.  The new ride holds 10 passengers in “escape proof” seats as it spins at 40
m.p.h.  The new ride consists of an arm that extends out 64 feet over the edge of the Tower and
spins passengers at up to three ‘G’s.’  As the ride spins faster and faster, the riders are propelled
up to an angle of 70 degrees, overlooking the City of Las Vegas more than 900 feet below.

The Tower also includes:

 Event space and wedding chapels, which have been recently renovated, at levels 103 and 104;

 Romance at Top of the World, a 156-seat lounge that underwent re-branding in an effort to
attract a more affluent clientele, as well as a refurbishment of its furnishings, fixtures and
kitchen, at level 107; and

 Indoor/outdoor observation decks, at levels 108 and 109, containing a gift shop, Starbucks®,
snack bar, free-standing vending machines featuring snacks and souvenirs designed to capitalize
on the unique nature of the Tower.

Recent construction projects on the Tower, including the removal of the rollercoaster, have hindered
customer traffic.  With these projects completed, management expects significant improvement to
EBITDA contribution from these attractions.

Retail and Entertainment

The retail center, located on the second floor of the base building, occupies approximately 110,000
square feet of developed retail space including 37 shops, 6 food venues, 13 merchant kiosks and a
full-service salon and spa.  The Company currently plans to open a new 23,000 square foot
nightclub/event center, Polly Esters, which will be located just off of the casino, in March.

Adjacent to the retail center is a 640-seat showroom that currently offers evening and late-night
shows, which are designed to appeal to value-oriented visitors who come to Las Vegas.  The
Stratosphere’s entertainment includes American Superstars, a celebrity tribute production show and
Bite, a vampire-themed adult review.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 17





Expansion Opportunities

The property also includes approximately 17 acres of undeveloped land, providing the Company
with the flexibility for additional expansion, if warranted.  Within the existing property, the
Company has approximately 112,000 square feet of undeveloped interior space.  The Company has
been in discussions with several third parties regarding plans to jointly develop additional
entertainment amenities within this space.

Business and Marketing Strategy

The Stratosphere utilizes a combination of capital-efficient attractions and competitive gaming
odds/payouts to attract visitors.  In addition, the property offers attractive and often unique table
games, including Single Zero Roulette and Ten Times Odds on Craps, which provide patrons with
odds that are better than the standard odds at other Las Vegas Strip casinos.  Furthermore, hotel
rooms, entertainment and food and beverage products are priced to appeal to the value-conscious,
middle-market Las Vegas visitor.

The property has also recently begun courting a younger, more affluent clientele with the opening of
a 23,000 square feet nightclub, Polly Esters, a $1.4 million center bar, and an “upscale lounge” on
the 107th floor of the observation tower

The Stratosphere participates in the A.C.E. Rewards and other aggressive marketing programs.
These programs permit members to accumulate points, which can be redeemed for cash at the
casino and complimentaries at all of ACEP’s properties.  The Company has approximately
1,085,170 members registered with its A.C.E. Rewards Program at the Stratosphere.  Importantly,
approximately 22.3% of the active A.C.E. Rewards members frequented the property, on average,
more than four times per month.

The Company uses the most sophisticated database marketing software available, Mariposa, to
aggressively target offers to current patrons.  Additionally, the Company uses billboards, radio and
television advertising, promotions and events, direct mailings to potential and current customers and
e-mail promotions to promote the property and target its customers.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 18





Competitive Landscape

Las Vegas Strip


Excalibur

New Frontier

Stardust Las Vegas Hilton

Circus Circus Riviera

Sahara

Stratosphere

0 mi 1 52 3 4

Excalibur

New Frontier

Stardust Las Vegas Hilton

Circus Circus Riviera

Sahara

Stratosphere

0 mi 1 52 3 40 mi 1 52 3 4






Bear, Stearns & Co. Inc.  CONFIDENTIAL 19





Selected Competitive Information
Property Casino Square Footage Slots Positions Hotel Rooms



Stratosphere(1)  80,000  1,309  1,603  2,444
Sahara  80,000  1,225  1,597  1,720
Riviera  102,300  1,330  1,546  2,254
Circus Circus  101,286  2,250  2,760  3,900
Las Vegas Hilton  76,500  1,340  1,778  2,956
Stardust  85,000  1,340  1,838  1,500
New Frontier  100,000  970  1,162  1,388
Excalibur  121,544  1,745  2,273  3,991
Source:  Company estimates and Casino City’s North American Gaming Almanac for FY2005.
Positions = Slots + (6*Tables).
As of December 31, 2006.

Financial Summary

The Stratosphere has been able to show very strong and consistent profit throughout its historical
period.  Through management innovation and focus on profitability, EBITDA has shown a CAGR
of 30% over the historical period.  Management anticipates very strong profit growth and strong
margins to continue in the future.  Throughout 2006, the Stratosphere’s extensive renovation
program temporarily disrupted traffic flow and visitation to the property, resulting in a temporary
decline in the property’s operating results in 2006.  With the renovation program now complete, the
Stratosphere is poised to exploit its relative competitive position as the only recently renovated
property on the Las Vegas Strip, north of Wynn Las Vegas.

Net Revenue ($ in millions) EBITDA ($ in millions)

$156.7
$163.7

$204.4$208.8

$196.2

$142.0

$182.9
$197.6

0

50

100

150

200

$250

2001 2002 2003 2004 2005 2006E 2007E 2008E
0

50

100

150

200

$250
’01–’08E CAGR:  5.7%

(1)

$15.8

$24.6

$27.9

$39.3

$45.7

$42.3

$45.5 $47.5

0

5

10

15

20

25

30

35

40

45

$50

2001 2002 2003 2004 2005 2006E 2007E 2008E
0

5

10

15

20

25

30

35

40

45

$50
’01–’08E CAGR:  17.0%

(1)

  % Margin 11.1% 15.7% 17.0% 21.5% 23.3% 21.4% 22.3% 22.7%


(1) Opened 1,000 room hotel tower in June 2001.














Section 3-B
Arizona Charlie’s Decatur






Bear, Stearns & Co. Inc.  CONFIDENTIAL 20





Arizona Charlie’s Decatur








Bear, Stearns & Co. Inc.  CONFIDENTIAL 21





Arizona Charlie’s Decatur
Arizona Charlie’s Decatur opened in April 1988 as a full-service casino and hotel geared toward
residents of Las Vegas and the surrounding communities.  The property is located on approximately
17 acres of land four miles west of the Las Vegas Strip in the heavily populated west Las Vegas
area and is easily accessible from Route 95, a major highway in Las Vegas.

The Company purchased the property in 1998 and subsequently completed a $38 million capital
improvement program.

Casino

Arizona Charlie’s Decatur contains approximately 52,000 square feet of gaming space with
approximately 1,379 slot machines, 15 table games, a race and sports book, a 24-hour bingo parlor,
a keno lounge and a poker lounge.  In 2001 and 2002, the Company expanded the slot floor and
upgraded the interior design of the casino.  More recently, Arizona Charlie’s Decatur converted
100% of its video poker and slot machines to “TITO” technology.

For the years ended December 31, 2006, 2005, 2004 and 2003, approximately 90.9%, 89.3%, 90.0%
and 90.8%, respectively, of the property’s gaming revenue was generated by slot machine play.
Arizona Charlie’s Decatur also derives other gaming revenue from bingo, keno, poker and the race
and sports book, which primarily are intended to attract customers for slot machines and table
games.

Hotel, Food and Beverage

Arizona Charlie’s Decatur currently has 258 rooms, including nine suites.  Hotel customers include
local residents and their out-of-town guests, as well as those business and leisure travelers who,
because of location or cost considerations, choose not to stay on the Las Vegas Strip or at other
hotels in Las Vegas.

Arizona Charlie’s Decatur has four restaurants, one of which is a franchised, quick-service
restaurant and three bars including a lounge.  In October 2003, ACEP opened the new Frisco
Market Buffet, a 260-seat San Francisco-themed eatery and in January 2007, the property completed
the conversion of the Yukon Grille on the first floor to an Outback Steakhouse in an effort to
increase branded dinning notoriety and attract new customers.

Retail and Entertainment

Arizona Charlie’s Decatur provides complimentary entertainment as a component of its overall
customer appeal.  The Naughty Ladies Saloon features a variety of entertainment, including live
bands and musician showcase nights.  In addition, a small gift shop located adjacent to the casino
provides a limited range of inexpensive gift items, candy, newspapers, magazines and cigarettes.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 22





Business and Marketing Strategy

Arizona Charlie’s Decatur markets its hotel and casino primarily to local residents of Las Vegas and
the surrounding communities, where an estimated 500,000 people live within a five-mile radius.
The Company believes that the property’s pricing and gaming odds make it one of the best values in
the gaming industry and that its gaming products, hotel rooms, restaurants and other amenities
attract local customers in search of reasonable prices, smaller casinos and more attentive service.
Arizona Charlie’s Decatur also tailors its selection of slot machines, including many diverse video
poker machines and table games, including double-deck, hand-dealt blackjack, to appeal to local
casino patrons.

Arizona Charlie’s Decatur participates in the A.C.E. Rewards and other aggressive marketing
programs.  These programs permit members to accumulate points, which can be redeemed for cash
at the casino and complimentaries at all of ACEP’s properties.  The Company has approximately
290,293 members registered with its A.C.E. Rewards Program at Arizona Charlie’s Decatur.
Importantly, approximately 39.0% of the active A.C.E. Rewards members frequented the property,
on average, more than four times per month.

The Company uses the most sophisticated database marketing software available, Mariposa, to
aggressively target offers to current patrons.  Additionally, the Company uses billboards, radio and
television advertising, promotions and events, direct mailings to potential and current customers and
e-mail promotions to promote the property and target its customers.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 23





Competitive Landscape

West Las Vegas Locals Market



Suncoast

Rampart Casino

Gold Coast

Palms

Fiesta Rancho

Texas Station

Santa Fe Station

Arizona Charlie’s Decatur

Palace Station

0 mi 1 52 3 4

Suncoast

Rampart Casino

Gold Coast

Palms

Fiesta Rancho

Texas Station

Santa Fe Station

Arizona Charlie’s Decatur

Palace Station

0 mi 1 52 3 40 mi 1 52 3 4






Bear, Stearns & Co. Inc.  CONFIDENTIAL 24





Selected Competitive Information
Property Casino Square Footage Slots Positions Hotel Rooms



Arizona Charlie’s Decatur(1)  52,000  1,379  1,469  258

Gold Coast  86,600  2,827  3,061  711
Suncoast  80,000  2,445  2,763  432
Santa Fe Station  77,000  2,570  2,762  200
Texas Station  132,437  2,400  2,670  202
Palms  95,000  1,900  2,260  420
Palace Station  84,000  1,860  2,190  1,030
Fiesta Rancho  70,000  1,640  1,790  100
Rampart Casino  50,000  1,180  1,372  541
Source:  Company estimates and Casino City’s North American Gaming Almanac for FY2005.
Positions = Slots + (6*Tables).
As of December 31, 2006.

Financial Summary

Management has been able to consistently generate strong returns at the Decatur property.
However, recent capital improvements and external traffic disruption at the Decatur property
created temporary visitation disruptions.  Construction projects by the Nevada Highway Authority,
as well as Nevada Gas, in close proximity to the Decatur property, resulted in disrupting access to
the property.  Additionally, the opening of Station Casino’s Red Rock Hotel & Casino presented
additional competition in the Decatur market.  Management does not believe these factors will have
a long term effect on the property’s performance, as the construction projects will be completed in
the near term and the Las Vegas locals markets have a demonstrated history of absorbing new
supply growth.  Furthermore, management believes the impact of Red Rock on Decatur’s operating
performance will be minimal, as the properties compete for a different segment of casino patrons.

Net Revenue ($ in millions)  EBITDA ($ in millions)

$73.4

$66.3 $67.8

$76.7

$84.3 $82.5
$85.8 $88.6

0

20

40

60

80

$100

2001 2002 2003 2004 2005 2006E 2007E 2008E
0

20

40

60

80

$10
’01–’08E CAGR:  2.7%



$17.2

$12.0

$25.7

$31.1
$29.1 $28.6 $29.7

$17.6

0

5

10

15

20

25

30

$35

2001 2002 2003 2004 2005 2006E 2007E 2008E
0

5

10

15

20

25

30

$35
’01–’08E CAGR:  8.1%


  % Margin 23.4% 18.1% 26.0% 33.5% 36.9% 35.2% 33.3% 33.5%
















Section 3-C
Arizona Charlie’s Boulder






Bear, Stearns & Co. Inc.  CONFIDENTIAL 25





Arizona Charlie’s Boulder








Bear, Stearns & Co. Inc.  CONFIDENTIAL 26





Arizona Charlie’s Boulder
Arizona Charlie’s Boulder opened in 1988 as a stand-alone hotel and RV park and is located on
approximately 24 acres of land, seven miles east of the Las Vegas Strip, near an I-515 interchange
in an established retail and residential neighborhood in the eastern metropolitan area of Las Vegas.
Since ACEP acquired the property in 2000, the Company has invested approximately $37 million to
open the casino and upgrade the amenities including a recently completed 7,300 square feet casino
expansion.

Casino

Arizona Charlie’s Boulder contains approximately 47,000 square feet of gaming space with
approximately 1,061 slot machines, 16 table games, a race and sports book and a 24-hour bingo
parlor.  In 2002, the Company completed a $5.1 million expansion project, which provided for an
additional 18,000 square feet of slot floor space, a 500-seat bingo hall and a 43-seat race and sports
book.  In July 2006, an $8.1 million expansion added approximately 6,000 square feet of gaming
space including 250 new slot machines, two new table games and a new A.C.E Rewards center.

Arizona Charlie’s Boulder emphasizes video poker because it is popular with local players and, as a
result, generates high volumes of play and casino revenue.  Arizona Charlie’s Boulder is 100%
converted to “TITO” technology.  Most table games at Arizona Charlie’s Boulder are devoted to
double-deck, hand-dealt blackjack play.

For the years ended December 31, 2006, 2005, 2004 and 2003, approximately 90.8%, 88.1%, 89.1%
and 86.9%, respectively, of gaming revenue was generated by slot machine play.  Arizona Charlie’s
Boulder also derives other gaming revenue from bingo and the race and sports book, which
primarily serve to attract customers for slot machines and table games.

Hotel, RV Park, Food and Beverage

Arizona Charlie’s Boulder hotel currently has 303 rooms, including 221 suites.  Arizona Charlie’s
Boulder also has a 12 acre RV park, one of the largest short-term RV parks on the Boulder Strip
with 30 to 70-foot pull through stations and over 200 spaces.  The RV park offers nightly, weekly
and monthly rates and a range of services, including laundry facilities, game and exercise rooms, a
swimming pool, a whirlpool and shower facilities.

Hotel customers include local residents and their out-of-town guests, as well as those business and
leisure travelers who, because of location or cost considerations, choose not to stay on the Las
Vegas Strip or at other hotels in Las Vegas.

Arizona Charlie’s Boulder has four restaurants and three bars, one of which is the Palace Grand
lounge.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 27





Retail and Entertainment

Arizona Charlie’s Boulder provides complimentary live entertainment in its lounge, The Palace
Grand, to attract customers.  A small gift shop located adjacent to the casino provides a limited
range of inexpensive gift items, candy, newspapers, magazines and cigarettes.

Business and Marketing Strategy

Arizona Charlie’s Boulder markets its hotel and casino primarily to residents of Las Vegas and the
surrounding communities, where an estimated 423,000 people live within a five-mile radius.  The
Company believes that its pricing and gaming odds make it one of the best values in the gaming
industry and that its gaming products, hotel rooms, restaurants, and other amenities attract local
customers in search of reasonable prices, smaller casinos and more attentive service.  Arizona
Charlie’s Boulder also tailors its selection of slot machines, including many diverse video poker
machines, and table games, including double-deck, hand-dealt blackjack, to local casino patrons.

Arizona Charlie’s Boulder also participates in the A.C.E. Rewards and other aggressive marketing
programs.  These programs permit members to accumulate points that can be redeemed for cash at
the casino and complimentaries at all of ACEP’s properties.  The Company has approximately
31,987 members registered with its A.C.E. Rewards Program at Arizona Charlie’s Boulder.
Importantly, approximately 34.1% of its active A.C.E. Rewards members frequented the property,
on average, more than four times per month.

The Company uses the most sophisticated database marketing software available, Mariposa, to
aggressively target offers to current patrons.  Additionally, the Company uses billboards, radio and
television advertising, promotions and events, direct mailings to potential and current customers and
e-mail promotions to promote the property and target its customers.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 28





Competitive Landscape

Boulder Strip Locals Market



Boulder Station

Arizona’s Charlie Boulder

Longshorn

Nevada Palace
Sam’s Town

Sunset Station

Klondike Sunset

Skyline

Jokers Wild

Fiesta Henderson

Eldorado

0 mi 1 52 3 4

Boulder Station

Arizona’s Charlie Boulder

Longshorn

Nevada Palace
Sam’s Town

Sunset Station

Klondike Sunset

Skyline

Jokers Wild

Fiesta Henderson

Eldorado

Boulder Station

Arizona’s Charlie Boulder

Longshorn

Nevada Palace
Sam’s Town

Sunset Station

Klondike Sunset

Skyline

Jokers Wild

Fiesta Henderson

Eldorado

0 mi 1 52 3 40 mi 1 52 3 4






Bear, Stearns & Co. Inc.  CONFIDENTIAL 29





Selected Competitive Information
Property Casino Square Footage Slots Positions Hotel Rooms



Arizona Charlie’s Boulder(1)  47,000  1,061  1,157  303

Sam’s Town  120,000  3,050  3,350  646
Boulder Station  90,000  2,900  3,176  300
Sunset Station  100,000  2,600  2,906  456
Fiesta Henderson  50,000  1,425  1,587  227
Nevada Palace  15,000  495  549  210
Source:  Company estimates and Casino City’s North American Gaming Almanac for FY2005.
Positions = Slots + (6*Tables).
Post current expansion projects.
As of December 31, 2006.

Financial Summary
Following the opening of the casino at Arizona Charlie’s Boulder, which upon acquisition in 2000
was a stand alone hotel and RV park, management has been able to deliver strong growth in both
revenues and EBITDA.  With the continued implementation of the various operating initiatives,
management believes Arizona Charlie’s Boulder will continue to show strong returns in the future.

The property faced challenges similar to those experienced by the Company’s other properties in
2006.  Similarly, the capital improvements initiated at the property created a temporary disruption in
traffic flow.  Management believes capital improvements completed at the Boulder property have
positioned the property for renewed growth in revenues and EBITDA going forward.

Net Revenue ($ in millions) EBITDA ($ in millions)

$27.5 $27.3

$40.4

$47.5 $48.0

$52.5
$55.8

$31.3

0

10

20

30

40

50

$60

2001 2002 2003 2004 2005 2006E 2007E 2008E
0

10

20

30

40

50

$60
’01–’08E CAGR:  10.6%





$7.2

$12.6

$11.0
$12.4

$13.2

($5.1)($4.6)

($1.4)

(8)

(4)

0

4

8

12

$16

2001 2002 2003 2004 2005 2006E 2007E 2008E
(8)

(4)

0

4

8

12

$16
’01–’08E CAGR:  NM


  % Margin (16.7%) (18.6%) (4.5%) 17.8% 26.5% 23.0% 23.6% 23.7%


















Section 3-D
Aquarius






Bear, Stearns & Co. Inc.  CONFIDENTIAL 30





Aquarius








Bear, Stearns & Co. Inc.  CONFIDENTIAL 31





Aquarius
The Aquarius is located on approximately 18 acres of land next to the Colorado River in Laughlin,
Nevada and is a tourist-oriented gaming and entertainment destination property.  The property
features the largest hotel in Laughlin, with 1,907 hotel rooms, a 57,000-square-foot casino, seven
dining options, 2,420 parking spaces, over 35,000 square feet of meeting space and a 3,300-seat
outdoor amphitheater.  The property targets mid to high market visitors from Southern California
and Arizona and locals from Laughlin, Nevada.

Following the closing of the acquisition on May 19th, 2006, the Company began making various
improvements to the property totaling approximately $40 million.

The following improvements have been completed:

 Redesign of the casino floor layout to include new and expanded amenities.

 New slot machines with enhanced new gaming systems and “TITO” technology.
•  1,000 new state-of-the-art slot machines.

 Re-branding of the property as Aquarius.
•  Installation of a new marquee.

 New front lobby.

 Enhancement of player amenities (including separate VIP check-in and lounge):
•  New High-Limit area;

•  New VIP Check-In;

•  New VIP Lounge;

•  Refurbished Center Bar.

 Enhancement of marketing programs to attract walk-in traffic from nearby outdoor River Walk.
•  New outdoor River Walk patio lounge.

 Enhancement of entertainment options including extensive showroom and lounge renovations.

The following improvements will continue through 2008:

 Hotel room refurbishment.

 Development of new food & beverage options:
•  Starbucks® coffee outlet.

•  Outback Steakhouse.

Casino

The Aquarius contains approximately 57,000 square feet of gaming space with approximately 1,021
slot machines, 42 table games, and a race and sports book.  The Company recently redesigned the






Bear, Stearns & Co. Inc.  CONFIDENTIAL 32





casino floor adding 1,000 new state of the art slot machines and converting to “TITO” technology.
Additionally, the Aquarius is enhancing the amenities offered to its players via the creation of a new
high limit area, a new VIP check in and a new VIP lounge.

For the years ended December 31, 2006, 2005, 2004 and 2003, approximately 80.6%, 79.2%, 79.2%
and 78.0%, respectively, of gaming revenue was generated by slot machine play.  The Aquarius
derives its other gaming revenue from the race and sports book, which primarily serve to attract
customers for slot machines and table games.

Hotel, Food and Beverage

Aquarius Hotel and Casino currently has 1,907 rooms, including 90 suites.  Hotel customers include
mid- to high-market visitors from Southern California and Arizona and locals from Laughlin,
Nevada.  The Aquarius has several restaurants, including a buffet and Outback Steakhouse, as well
as three bars.

Retail and Entertainment

The Aquarius has a 2,000-seat indoor venue regularly featuring sports or concert events and a
3,300-seat outdoor amphitheater ideal for holding concerts.  The hotel also has an outdoor pool,
fitness center, and lighted tennis courts.

Business and Marketing Strategy

Aquarius participates in the A.C.E. Rewards and other aggressive marketing programs.  These
programs permit members to accumulate points, which can be redeemed for cash at the casino and
complimentaries at all of ACEP’s properties.  Notably, the Company has access to approximately
472,000 members registered with Harrah’s, at Laughlin, at the time of acquisition.

The Company uses the most sophisticated database marketing software available, Mariposa, to
aggressively target offers to current patrons.  Additionally, the Company uses billboards, radio and
television advertising, promotions and events, direct mailings to potential and current customers and
e-mail promotions to promote the property and target its customers.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 33





Competitive Landscape
Advantageous position in the Laughlin market.










Bear, Stearns & Co. Inc.  CONFIDENTIAL 34





Selected Competitive Information
Property Casino Square Footage Slots Positions Hotel Rooms



Aquarius(1)  57,000  1,021  1,273  1,907
Don Laughlin’s Hotel & Casino  60,000  1,525  1,753  1,404
Ramada Express  53,000  1,350  1,530  1,500
Colorado Belle Hotel Casino & Microbrewery  60,000  1,220  1,478  1,173
Harrah’s Laughlin  47,000  1,200  1,464  1,560
River Palms Resort Casino  120,000  1,250  1,400  1,003
Edgewater Hotel and Casino  60,000  1,125  1,389  1,396
Golden Nugget Laughlin  32,600  1,000  1,096  300
Avi Resort and Casino  25,000  845  995  455
Pioneer Hotel and Gambling Hall  25,532  776  872  416
Source:  Company estimates and Casino City’s North American Gaming Almanac for FY2005.
Positions = Slots + (6*Tables).
As of September 30, 2006.

Financial Summary
Prior to ACEP’s purchase of the Aquarius, historical results were inconsistent given the previous
owners view of the Aquarius as a non-strategic asset.  Upon acquisition by ACEP in May 2006, the
Company implemented a $40 million capital improvement plan to reposition the property which
resulted in significant disruption at the property.  Management believes Aquarius is now positioned
to regain its former presence as the preeminent casino in the Laughlin market.

Net Revenue ($ in millions)  EBITDA ($ in millions)

$119.6

$108.2

$101.6

$107.0

$123.8
$120.4

$107.4
$111.6

80

90

100

110

120

130

$140

2001 2002 2003 2004 2005 2006E2007E2008E
80

90

100

110

120

130

$140
’01–’08E CAGR:  1.0%





$22.5

$20.0

$9.0

$12.6

$17.0

$13.4

$15.1

$19.2

0

5

10

15

20

$25

2001 2002 2003 2004 2005 2006E 2007E 2008E
0

5

10

15

20

$25
’01–’08E CAGR:  2.3%

  % Margin 17.2% 14.1% 11.1% 13.7% 11.8% 8.9% 18.5% 18.8%















Section 4
Financial Review






Bear, Stearns & Co. Inc.  CONFIDENTIAL 35





Financial Review
From 2001 to 2005, consolidated net revenue and EBITDA grew at a compounded annual growth
rate of 7.8% and 33.6%, respectively, with revenues increasing from $242.5 million to $328.0
million and EBITDA increasing from $28.1 million to $89.4 million.

Historical Net Revenue ($ in millions)  Historical EBITDA ($ in millions)

7.8% CAGR ‘01–‘05

$242.5 $250.0 $262.8
$300.0

$328.0

0

100

200

300

400

$500

2001 2002 2003 2004 2005
0

100

200

300

400

$500

(1)

33.6% CAGR ‘01–‘05
$72.4

$44.1
$31.3$28.1

$89.4

0

20

40

60

80

$100

2001 2002 2003 2004 2005
0

20

40

60

80

$100

(1)


 % Margin 11.6% 12.5% 16.8% 24.1% 27.3%


(1) Stratosphere completed a 1,000 room hotel room expansion in June 2001.

Beginning in 2005 and continuing throughout 2006, the Company embarked upon a comprehensive
capital improvement program, aimed at enhancing the position of each property in its respective
market.  As a result of this initiative, the properties experienced temporary construction disruptions,
which, in conjunction with a modest softening in the Las Vegas market overall, led to a modest
decline in operating performance in 2006.

Virtually all of the Company’s capital improvement programs are now complete, and management
believes each of the properties are now poised to capitalize on these improvements going forward.

Protected Net Revenue ($ in millions)  Projected EBITDA ($ in millions)

4.9% CAGR ‘06E PF–‘08E

$429.7 $450.9 $472.8

0

100

200

300

400

500

600

$700

2006E PF 2007E 2008E
0

100

200

300

400

500

600

$700

(2)

11.1% CAGR ‘06E PF–‘08E

$91.5
$106.5 $112.9

0

25

50

75

100

125

$150

2006E PF 2007E 2008E
0

25

50

75

100

125

$150

(2)


 % Margin 21.3% 23.6% 23.9%


(2) Pro Forma results include Aquarius.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 36





Balance Sheet Information

Consolidated Balance Sheet ($ in millions)

 As of December 31,
 2003 2004 2005 2006E(1)

ASSETS
Current Assets:

Cash and cash equivalents  $77.3  $75.2  $108.3  $54.9
Restricted cash  –  0.4  0.5  0.3
Marketable securities  4.2  –  –  –
Investments - restricted  3.0  2.5  2.8  3.5
Accounts receivable, net  4.1  3.9  4.2  6.8
Related party receivables  0.2  0.4  1.0  0.5
Deferred income taxes  3.0  2.7  2.3  2.9
Other current assets  9.2  10.3  12.1  16.8

Total Current Assets  $100.9  $95.5  $131.2  $85.6

Property and equipment, net  $324.5  $314.6  $319.5  $445.8

Debt issuance and deferred financing costs, net  $0.3  $7.4  $6.4  $5.7
Lessee incentive  0.6  0.4  –  –
Other receivable  0.1  –  –  –
Deferred income taxes  54.4  46.4  37.2  36.2
Customer list, net  –  –  –  2.5

Total Other Assets  $55.3  $54.3  $43.6  $44.5

TOTAL ASSETS  $480.7  $464.3  $494.3  $575.8

LIABILITIES AND MEMBER’S EQUITY
Current Liabilities:

Accounts payable  $5.9  $5.2  $4.4  $6.7
Accrued expenses  17.8  22.8  22.6  33.2
Accrued payroll and related expenses  12.4  10.8  11.0  14.4
Current portion of capital lease obligation  0.4  0.5  0.5  0.5
Current portion of notes payable to related party  14.8  –  –  –

Total Current Liabilities  $51.3  $39.2  $38.4  $54.8

Long-Term Liabilities
Notes payable to related party  $86.5  –  –  –
Notes payable  –  215.0  215.0  255.0
Accrued lessee incentive  0.6  0.6  –  –
Capital lease obligations, less current portion  3.6  3.3  2.8  2.3
Deferred income taxes  5.1  –  –  –
Other  3.4  5.3  5.9  6.0

Total Long-Term Liabilities  $99.1  $224.1  $223.7  $263.3

Total Liabilities  $150.4  $263.3  $262.2  $318.1

Member’s/Stockholders’ Equity:
Common stock  $0.0  –  –  –
APIC  293.5  –  –  –
Member’s Equity  –  201.0  232.1  257.7
Retained earnings  36.9  –  –  –

Total Member’s/Stockholders’ Equity  $330.3  $201.0  $232.1  $257.7

TOTAL LIABILITIES AND MEMBER’S
EQUITY

 $480.7  $464.3  $494.3  $575.8



(1) Includes Laughlin financials since acquisition, May 2006.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 37





Historical Income Statement

Income Statement ($ in millions)

 Year Ended December 31, Projected
 2002 2003 2004 2005 2006E(1) 2007E 2008E

Revenues:
Casino  $143.1  $147.9  $168.0  $182.9  $220.8  $271.1  $287.2
Hotel  44.3  47.3  54.7  61.9  75.6  85.8  90.2
Food and beverage  56.3  59.6  67.0  70.1  83.7  95.3  97.2
Tower, retail and other income  28.2  30.3  33.8  35.4  35.9  37.3  38.6
Gross Revenues  $271.9  $285.1  $323.4  $350.3  $416.0  $489.6  $513.2

Less promotional allowances  21.9  22.3  23.4  22.3  30.3  38.7  40.3
Net revenues  $250.0  $262.8  $300.0  $328.0  $385.7  $450.9  $472.8

Cost and expenses:
Casino  $59.9  $61.3  $62.0  $63.2  $80.1  $91.6  $95.2
Hotel  20.1  22.1  24.3  27.0  33.4  37.7  39.8
Food and beverage  43.4  45.0  48.5  51.8  60.1  67.0  68.2
Tower, retail and other operations  14.9  14.0  14.0  15.4  16.9  18.1  19.3
Selling, general and administrative  80.0  75.0  78.7  81.3  107.1  130.0  137.5
Depreciation and amortization  20.2  20.2  23.5  23.3  28.6  35.9  36.5
Pre-opening costs   –  –  –  1.9  –  –
(Gain) loss on disposal of assets  0.4  1.4  0.1  0.0  0.2  –  –
Total costs and expenses  $238.9  $239.0  $251.1  $261.9  $328.2  $380.3  $396.5

Income from operations  $11.1  $23.8  $48.9  $66.1  $57.5  $70.6  $76.3

Other income (expense):
Interest income  $0.7  $0.4  $1.0  $1.6  $2.2  $0.4  $0.4
Interest expense  (6.0 )  (5.4 )  (18.9 )  (18.8 )  (21.3 )  (22.2 )  (22.2 )

Total other expense  ($5.3 )  ($5.0 )  ($17.9 )  ($17.2 )  ($19.0 )  ($21.8 )  ($21.8 )

Income before income taxes  $5.8  $18.9  $31.0  $48.8  $38.4  $48.8  $54.5

Provision (benefit) from income taxes  $4.9  ($1.8 )  $10.1  $16.8  $12.8  $17.1  $19.5
Net income  $0.9  $20.7  $20.9  $32.0  $25.6  $31.7  $35.0

EBITDA  $31.3  $44.1  $72.4  $89.4  $86.1  $106.5  $112.9




(1) Includes Laughlin financials since acquisition, May 2006.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 38





Historical Statement of Cash Flows

Consolidated Statements of Cash Flows ($ in millions)

 Year Ended December 31,
 2002 2003 2004 2005 2006E(1)

CASH FLOWS FROM OPERATING ACTIVITIES:

Net income  $0.9  $20.7  $20.9  $32.0  $25.6

Depreciation and amortization  20.2  20.2  23.5  23.3  28.6

(Gain) loss on sale or disposal of assets  0.4  1.4  0.1  (0.0 )  0.2

Provision (benefit) for deferred income taxes  1.8  (5.4 )  7.4  9.6  0.3

Changes in operating assets and liabilities:

Restricted cash  –  1.9  (0.4 )  (0.1 )  0.2

Accounts receivable, net  (0.1 )  0.2  0.1  (0.2 )  (0.7 )

Other current assets  1.8  1.7  0.3  (0.7 )  (2.5 )

Accounts payable and accrued expenses  5.4  3.7  2.7  (2.3 )  11.4

Other  –  3.4  –  0.6  0.1

Net Cash Provided By Operating Activities  $30.2  $47.8  $54.6  $62.3  $63.5

CASH FLOWS FROM INVESTING ACTIVITIES:

(Increase) decrease in investments—restricted  ($1.6 )  ($0.3 )  $0.4  ($0.3 )  ($0.6 )

Sale of marketable securities  –  –  4.2  –  –

Acquisition of property and equipment  (22.1 )  (30.4 )  (14.0 )  (28.2 )  (46.9 )

Acq. of Flamingo Laughlin, net of cash acquired  –  –  –  –  (109.4 )

Payment for construction-in-progress  (0.8 )  –  –  –  0.0

Related party receivables  0.4  (0.2 )  (0.2 )  (0.2 )  0.5

Cash proceeds from sale of property and equipment  0.0  0.5  0.4  0.0  0.5

Net Cash Used in Investing Activities  ($24.1 )  ($30.4 )  ($9.1 )  ($28.7 )  ($156.0 )

CASH FLOWS FROM FINANCING ACTIVITIES:

Debt issuance and deferred financing costs  ($0.9 )  ($0.1 )  ($1.5 )  –  ($0.5 )

Proceeds from line of credit  –  –  –  –  60.0

Proceeds from related party note payable  17.2  7.8  –  –  –

Proceeds from notes payable  –  –  215.0  –  –

Member contribution  0.6  –  28.2  –  –

Capital distribution  –  –  (61.9 )  –  –

Acquisition of Arizona Charlie’s  –  –  (125.9 )  –  –

Payments on line of credit  –  –  –  –  (20.0 )

Payments on related party notes payable  (9.3 )  (7.2 )  (101.3 )  –  –

Payments on long-term debt  (0.0 )  –  –  –  –

Payments on capital lease obligation  (3.3 )  –  (0.2 )  (0.5 )  (0.5 )

Cash acquired from subsidiary contributed by parent  0.3  –  –  –  –

Net Cash Provided By (Used In) Financing Activities  $4.6  $0.5  ($47.6 )  ($0.5 )  $39.1

Net increase (decrease) in cash and cash equivalents  $10.8  $17.9  ($2.1 )  $33.2  ($53.4 )

Cash and cash equivalents—beginning of period  48.6  59.3  77.3  75.2  108.3

Cash And Cash Equivalents—End of Period  $59.3  $77.3  $75.2  $108.3  $54.9



(1) Includes Laughlin financials since acquisition, May 2006.














Section 5
Management






Bear, Stearns & Co. Inc.  CONFIDENTIAL 39





Senior Management Biographies
Richard P. Brown—President and CEO

Richard Brown has served as President and CEO of the Company since June 2002.  Mr. Brown
joined the Company in March 2000 as Executive Vice President of Marketing for the Stratosphere
and both Arizona Charlie’s properties, while also serving as one of three key executives responsible
for overall operations of the Stratosphere.  In January 2001, he was promoted to COO, responsible
for the operations of all three properties, and then to President and CEO in June 2002.  Prior to
joining the Company, Mr. Brown held executive positions with Harrah’s Entertainment and Hilton
Gaming.  In addition, he has held positions with New York Racing Association, Travelers
Companies of Hartford, Connecticut and J. Walter Thompson Company.  Mr. Brown holds a
bachelors degree in Economics from Southern Connecticut State College.

Denise Barton—Senior Vice President of Support Services and Chief Financial Officer

Denise Barton has served as Senior Vice President of Support Services and Chief Financial Officer
of the Company since February, 2003.  Ms. Barton oversees all consolidated support services for the
Stratosphere Casino Hotel and Tower, Arizona Charlie’s Decatur and Arizona Charlie’s Boulder.
Ms. Barton joined the Company in August 2002 as Vice President of Finance and Chief Financial
Officer of the Stratosphere.  Prior to joining the Company, Ms. Barton served in various
management and leadership positions in the finance field, most recently as Chief Financial Officer
for Lowestfare.com.  Ms. Barton spent nine years at KPMG in Las Vegas as audit senior manager,
audit manager and senior accountant serving a variety of gaming and hospitality clients, both
publicly and privately held.  Ms. Barton is a Certified Public Accountant and holds a Bachelor of
Science degree in Accounting from Southern Utah University.

Ron Lurie—Executive Vice President and General Manager of Arizona Charlie’s Decatur

Ron Lurie has served as Executive Vice President and General Manager of Arizona Charlie’s
Decatur since January 1999.  Prior to that time, Mr. Lurie held a number of other positions at the
property.  Mr. Lurie has been involved in the gaming industry for over 25 years, having held
positions with IGT and Sigma Games prior to joining the property.  Mr. Lurie has served four years
as the Mayor of the Las Vegas and 14 years as a Las Vegas City Councilman.  Mr. Lurie is a board
member and past president of the West Charleston Lion’s Club, board member and past president of
the Boys & Girls Clubs of Las Vegas, serves on the Board of Governors at Valley Hospital, Board
of Directors of Youth Charities of Southern Nevada and Opportunity Village as well as Foundation
Board of the Community College of Southern Nevada.  He continues to serve in an advisory
capacity to many other boards of charitable organizations in Las Vegas.






Bear, Stearns & Co. Inc.  CONFIDENTIAL 40





Senior Management Biographies (cont.)
Mark Majetich—Senior Vice President and General Manager at Arizona Charlie’s Boulder

Mark Majetich has been Vice President and General Manager at Boulder since May 2001.  Prior to
that, he was Director of Operations at the property.  Mr. Majetich originally joined the Company in
2000 as Director of Hotel Operations at Stratosphere.  Prior to joining the Company, Mr. Majetich
held positions at Excalibur (1992–2000) and Caesars Tahoe (1980–1992).  Mr. Majetich serves on
the board of directors of the Nick and Kelly Children’s Heart Fund, a non-profit charity dedicated to
children who have major heart diseases.  Mr. Majetich graduated from the University of Nebraska,
in Lincoln, with a Bachelor of Science degree in Education.

John Lind—Senior Vice President and General Manager at Laughlin

Mr. Lind has been the Senior Vice President and General Manager at Flamingo Laughlin since June
14, 2006.  Mr. Lind was a Senior Vice President at Ramada Express Hotel/Casino, Laughlin,
Nevada from August 1995 to 2005.  Prior to that, he was Chief Financial Officer at Lady Luck
Casino, Bettendorf, Iowa from December 1994 to August 1995.  Prior to that, he held various
positions in the gaming industry, including the position of CFO at Peppermill Casinos, Reno,
Nevada from April 1984 to June 1993, and Assistant Controller at MGM Grand Hotel/Casino,
Reno, Nevada from April 1982 to April 1984.  Mr. Lind is a Certified Public Accountant and holds
a degree in Business Administration from the University of Montana, in Missoula.














Section 6
Process Considerations






Bear, Stearns & Co. Inc.  CONFIDENTIAL 41





Process Considerations
 Interested parties should submit a written indication of interest (“Indications”) no later than 5:00
pm EST on Friday, March 2, 2007 detailing:
•  Proposed purchase price

•  Proposed transaction structure

•  Proposed sources of financing, including timing and steps to secure committed financing (if it is part
of a potential proposal)

•  Detailed due diligence and information request list, including the amount of time required to complete
the due diligence investigation

•  Any material terms or conditions that a proposal would be subject to

•  Detail of any anticipated corporate or regulatory approvals and associated timing

 Following receipt of Indications, Bear Stearns will notify a limited number of parties (“Invited
Parties”) that they have been invited to continue to work towards a transaction.  Invited Parties
will have the opportunity to conduct additional due diligence, including:
•  Access to certain members of the Facility’s management team

•  Access to a data room containing business and legal information

 This overview may include certain forward-looking statements and estimates, which are based
on assumptions by American Casino and Entertainment Properties, LLC. that may or may not
prove to be correct, and the business contains various risks and uncertainties.  Accordingly,
there can be no assurances that such statements or estimates are accurate, and actual results may
vary materially.  This overview is not, nor is it intended to be, an offer to purchase any assets of
American Casino and Entertainment Properties, LLC.

 All communications regarding interest in this opportunity should be directed to one of the
representatives of Bear Stearns listed below, and we request that prospective buyers refrain from
contacting the management or employees of American Casino and Entertainment Properties,
LLC, directly.

BEAR, STEARNS & CO. INC.
383 Madison Avenue
New York, NY 10179

(212) 272-2000

Kenneth Shea
Senior Managing Director

Tel:  (212) 272-6494
Fax:  (212) 881-9718

kshea@bear.com

Drew Kelley
Vice President

Tel:  (212) 272-7181
Fax:  (212) 881-9848
dmkelley@bear.com

Robert Pellegrini
Associate

Tel:  (212) 272-3081
Fax:  (212) 881-9410
rpellegrini@bear.com

May Lam
Analyst

Tel:  (212) 272-0841
Fax:  (212) 881-9732

mlam@bear.com
"""


def test_report(long_form_report_service: LongformReportService):
    resp = long_form_report_service.generate(DATA)
    breakpoint()
