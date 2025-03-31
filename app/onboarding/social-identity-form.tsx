"use client"

import { useOnboarding } from "@/contexts/onboarding-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SocialIdentityForm() {
  const { data, updateSocialIdentity } = useOnboarding()
  const social = data.social

  // disabilities가 undefined일 경우를 대비한 기본값 설정
  const disabilities = social.disabilities || { has: false, details: "" }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">1. What is your age?</Label>
              <Select value={social.age} onValueChange={(value) => updateSocialIdentity({ age: value })}>
                <SelectTrigger id="age">
                  <SelectValue placeholder="Select your age range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-20">Under 20</SelectItem>
                  <SelectItem value="20s">20s</SelectItem>
                  <SelectItem value="30s">30s</SelectItem>
                  <SelectItem value="40s">40s</SelectItem>
                  <SelectItem value="50s">50s</SelectItem>
                  <SelectItem value="60s">60s</SelectItem>
                  <SelectItem value="70s-or-older">70s or older</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Biological Sex */}
            <div className="space-y-2">
              <Label htmlFor="biologicalSex">2. What is your biological sex?</Label>
              <RadioGroup
                id="biologicalSex"
                value={social.biologicalSex}
                onValueChange={(value) => updateSocialIdentity({ biologicalSex: value })}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="font-normal">
                    Male
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="font-normal">
                    Female
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intersex" id="intersex" />
                  <Label htmlFor="intersex" className="font-normal">
                    Intersex
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Gender Identity */}
            <div className="space-y-2">
              <Label htmlFor="genderIdentity">3. What is your gender identity?</Label>
              <Select
                value={social.genderIdentity}
                onValueChange={(value) => updateSocialIdentity({ genderIdentity: value })}
              >
                <SelectTrigger id="genderIdentity">
                  <SelectValue placeholder="Select your gender identity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="man">Man</SelectItem>
                  <SelectItem value="woman">Woman</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="transgender">Transgender</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Sexual Orientation */}
            <div className="space-y-2">
              <Label htmlFor="sexualOrientation">4. What is your sexual orientation?</Label>
              <Select
                value={social.sexualOrientation}
                onValueChange={(value) => updateSocialIdentity({ sexualOrientation: value })}
              >
                <SelectTrigger id="sexualOrientation">
                  <SelectValue placeholder="Select your sexual orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight">Straight (heterosexual)</SelectItem>
                  <SelectItem value="gay">Gay</SelectItem>
                  <SelectItem value="lesbian">Lesbian</SelectItem>
                  <SelectItem value="bisexual">Bisexual</SelectItem>
                  <SelectItem value="pansexual">Pansexual</SelectItem>
                  <SelectItem value="asexual">Asexual</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Ethnicity */}
            <div className="space-y-2">
              <Label htmlFor="ethnicity">5. What is your ethnicity?</Label>
              <Input
                id="ethnicity"
                placeholder="e.g., North American, European, Asian"
                value={social.ethnicity}
                onChange={(e) => updateSocialIdentity({ ethnicity: e.target.value })}
              />
            </div>

            <Separator />

            {/* Race */}
            <div className="space-y-2">
              <Label htmlFor="race">6. What is your race?</Label>
              <Select value={social.race} onValueChange={(value) => updateSocialIdentity({ race: value })}>
                <SelectTrigger id="race">
                  <SelectValue placeholder="Select your race" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="black">Black or African American</SelectItem>
                  <SelectItem value="asian">Asian</SelectItem>
                  <SelectItem value="native-american">American Indian or Alaska Native</SelectItem>
                  <SelectItem value="pacific-islander">Native Hawaiian or Pacific Islander</SelectItem>
                  <SelectItem value="hispanic">Hispanic or Latino</SelectItem>
                  <SelectItem value="mixed">Mixed or Multiple</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Disabilities */}
            <div className="space-y-2">
              <Label>7. Do you have any disabilities or impairments?</Label>
              <RadioGroup
                value={disabilities.has ? "yes" : "no"}
                onValueChange={(value) =>
                  updateSocialIdentity({
                    disabilities: {
                      has: value === "yes",
                      details: value === "no" ? "" : disabilities.details
                    }
                  })
                }
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="disabilities-yes" />
                  <Label htmlFor="disabilities-yes" className="font-normal">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="disabilities-no" />
                  <Label htmlFor="disabilities-no" className="font-normal">
                    No
                  </Label>
                </div>
              </RadioGroup>

              {disabilities.has && (
                <div className="pt-2">
                  <Label htmlFor="disabilities-details">Please specify:</Label>
                  <Textarea
                    id="disabilities-details"
                    placeholder="Please describe your disability or impairment"
                    value={disabilities.details}
                    onChange={(e) =>
                      updateSocialIdentity({
                        disabilities: {
                          ...disabilities,
                          details: e.target.value,
                        },
                      })
                    }
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality">8. What is your nationality?</Label>
              <Input
                id="nationality"
                placeholder="e.g., United States, Canada, United Kingdom"
                value={social.nationality}
                onChange={(e) => updateSocialIdentity({ nationality: e.target.value })}
              />
            </div>

            <Separator />

            {/* Dual Nationality */}
            <div className="space-y-2">
              <Label>9. Do you hold dual nationality?</Label>
              <RadioGroup
                value={social.dualNationality.has ? "yes" : "no"}
                onValueChange={(value) =>
                  updateSocialIdentity({
                    dualNationality: {
                      ...social.dualNationality,
                      has: value === "yes",
                    },
                  })
                }
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="dual-nationality-yes" />
                  <Label htmlFor="dual-nationality-yes" className="font-normal">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="dual-nationality-no" />
                  <Label htmlFor="dual-nationality-no" className="font-normal">
                    No
                  </Label>
                </div>
              </RadioGroup>

              {social.dualNationality.has && (
                <div className="pt-2">
                  <Label htmlFor="dual-nationality-details">Please specify:</Label>
                  <Input
                    id="dual-nationality-details"
                    placeholder="e.g., United States and Canada"
                    value={social.dualNationality.details}
                    onChange={(e) =>
                      updateSocialIdentity({
                        dualNationality: {
                          ...social.dualNationality,
                          details: e.target.value,
                        },
                      })
                    }
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Residence */}
            <div className="space-y-2">
              <Label htmlFor="residence">10. Where do you currently reside?</Label>
              <Input
                id="residence"
                placeholder="e.g., Pasadena, California"
                value={social.residence}
                onChange={(e) => updateSocialIdentity({ residence: e.target.value })}
              />
            </div>

            <Separator />

            {/* Education */}
            <div className="space-y-2">
              <Label htmlFor="education">11. What is your highest level of education?</Label>
              <Select value={social.education} onValueChange={(value) => updateSocialIdentity({ education: value })}>
                <SelectTrigger id="education">
                  <SelectValue placeholder="Select your education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less-than-high-school">Less than high school</SelectItem>
                  <SelectItem value="high-school">High school graduate</SelectItem>
                  <SelectItem value="some-college">Some college</SelectItem>
                  <SelectItem value="associates">Associate's degree</SelectItem>
                  <SelectItem value="bachelors">Bachelor's degree</SelectItem>
                  <SelectItem value="masters">Master's degree</SelectItem>
                  <SelectItem value="doctorate">Doctorate degree</SelectItem>
                  <SelectItem value="professional">Professional degree</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Occupation */}
            <div className="space-y-2">
              <Label htmlFor="occupation">12. What is your current occupation?</Label>
              <Select value={social.occupation} onValueChange={(value) => updateSocialIdentity({ occupation: value })}>
                <SelectTrigger id="occupation">
                  <SelectValue placeholder="Select your occupation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time employed</SelectItem>
                  <SelectItem value="part-time">Part-time employed</SelectItem>
                  <SelectItem value="self-employed">Self-employed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="homemaker">Homemaker</SelectItem>
                  <SelectItem value="unable-to-work">Unable to work</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Field of Study */}
            <div className="space-y-2">
              <Label htmlFor="fieldOfStudy">13. What is your major or field of study? (if applicable)</Label>
              <Input
                id="fieldOfStudy"
                placeholder="e.g., Computer Science, Psychology, Business"
                value={social.fieldOfStudy}
                onChange={(e) => updateSocialIdentity({ fieldOfStudy: e.target.value })}
              />
            </div>

            <Separator />

            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="jobTitle">14. What is your current job title? (if applicable)</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Software Engineer, Teacher, Manager"
                value={social.jobTitle}
                onChange={(e) => updateSocialIdentity({ jobTitle: e.target.value })}
              />
            </div>

            <Separator />

            {/* Perceived Income */}
            <div className="space-y-2">
              <Label htmlFor="perceivedIncome">15. What is your perceived monthly income?</Label>
              <Select
                value={social.perceivedIncome}
                onValueChange={(value) => updateSocialIdentity({ perceivedIncome: value })}
              >
                <SelectTrigger id="perceivedIncome">
                  <SelectValue placeholder="Select your income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less-than-1000">Less than $1,000 USD</SelectItem>
                  <SelectItem value="1000-2500">$1,000 - $2,500 USD</SelectItem>
                  <SelectItem value="2500-5000">$2,500 - $5,000 USD</SelectItem>
                  <SelectItem value="5000-7500">$5,000 - $7,500 USD</SelectItem>
                  <SelectItem value="more-than-7500">More than $7,500 USD</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Subjective Income */}
            <div className="space-y-2">
              <Label htmlFor="subjectiveIncome">16. How would you describe your subjective income level?</Label>
              <Select
                value={social.subjectiveIncome}
                onValueChange={(value) => updateSocialIdentity({ subjectiveIncome: value })}
              >
                <SelectTrigger id="subjectiveIncome">
                  <SelectValue placeholder="Select your subjective income level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="far-below-average">Far below average</SelectItem>
                  <SelectItem value="below-average">Below average</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="above-average">Above average</SelectItem>
                  <SelectItem value="far-above-average">Far above average</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Income Satisfaction */}
            <div className="space-y-2">
              <Label htmlFor="incomeSatisfaction">17. How satisfied are you with your income?</Label>
              <Select
                value={social.incomeSatisfaction}
                onValueChange={(value) => updateSocialIdentity({ incomeSatisfaction: value })}
              >
                <SelectTrigger id="incomeSatisfaction">
                  <SelectValue placeholder="Select your satisfaction level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-at-all">Not at all satisfied</SelectItem>
                  <SelectItem value="somewhat">Somewhat satisfied</SelectItem>
                  <SelectItem value="pretty-well">Pretty well satisfied</SelectItem>
                  <SelectItem value="completely">Completely satisfied</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Social Class */}
            <div className="space-y-2">
              <Label htmlFor="socialClass">18. How would you classify your social class?</Label>
              <Select
                value={social.socialClass}
                onValueChange={(value) => updateSocialIdentity({ socialClass: value })}
              >
                <SelectTrigger id="socialClass">
                  <SelectValue placeholder="Select your social class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lower-class">Lower class</SelectItem>
                  <SelectItem value="working-class">Working class</SelectItem>
                  <SelectItem value="lower-middle-class">Lower middle class</SelectItem>
                  <SelectItem value="middle-class">Middle class</SelectItem>
                  <SelectItem value="upper-middle-class">Upper middle class</SelectItem>
                  <SelectItem value="upper-class">Upper class</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Living Arrangement */}
            <div className="space-y-2">
              <Label htmlFor="livingArrangement">19. What is your living arrangement?</Label>
              <Select
                value={social.livingArrangement}
                onValueChange={(value) => updateSocialIdentity({ livingArrangement: value })}
              >
                <SelectTrigger id="livingArrangement">
                  <SelectValue placeholder="Select your living arrangement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alone">Living alone</SelectItem>
                  <SelectItem value="with-partner">Living with a partner/spouse</SelectItem>
                  <SelectItem value="with-family">Living with family</SelectItem>
                  <SelectItem value="with-roommates">Living with roommates</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Political Affiliation */}
            <div className="space-y-2">
              <Label htmlFor="politicalAffiliation">20. What is your political affiliation?</Label>
              <Select
                value={social.politicalAffiliation}
                onValueChange={(value) => updateSocialIdentity({ politicalAffiliation: value })}
              >
                <SelectTrigger id="politicalAffiliation">
                  <SelectValue placeholder="Select your political affiliation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very-liberal">Very liberal</SelectItem>
                  <SelectItem value="liberal">Liberal</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="very-conservative">Very conservative</SelectItem>
                  <SelectItem value="libertarian">Libertarian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Religious Affiliation */}
            <div className="space-y-2">
              <Label htmlFor="religiousAffiliation">21. What is your religious affiliation?</Label>
              <Select
                value={social.religiousAffiliation}
                onValueChange={(value) => updateSocialIdentity({ religiousAffiliation: value })}
              >
                <SelectTrigger id="religiousAffiliation">
                  <SelectValue placeholder="Select your religious affiliation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="christianity">Christianity</SelectItem>
                  <SelectItem value="islam">Islam</SelectItem>
                  <SelectItem value="hinduism">Hinduism</SelectItem>
                  <SelectItem value="buddhism">Buddhism</SelectItem>
                  <SelectItem value="judaism">Judaism</SelectItem>
                  <SelectItem value="sikhism">Sikhism</SelectItem>
                  <SelectItem value="no-religion">No Religion</SelectItem>
                  <SelectItem value="agnostic">Agnostic</SelectItem>
                  <SelectItem value="atheist">Atheist</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

